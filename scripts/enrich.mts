/**
 * ZEROSHOT · deck enrichment
 *
 * The deck in lib/architectures.ts is hand-curated. This script does NOT
 * generate it — it audits it, so a human only ever reviews diffs.
 *
 * Source order, most to least trusted:
 *   1. arXiv API            canonical first-preprint date + exact title
 *   2. Semantic Scholar     venue, author affiliations, citation count
 *   3. Hugging Face Hub     parameter counts (safetensors), licence -> weights
 *   4. Wikidata SPARQL      organisation -> country
 *
 * Everything here is a public JSON/Atom API with no key required. No HTML
 * scraping: the pages that hold this data (Papers with Code is gone, arXiv
 * listings are unstable) are worse sources than the APIs behind them.
 *
 *   npm run enrich                 audit the whole deck (~4 min, rate-limited)
 *   npm run enrich -- --limit 10   first 10 entries
 *   npm run enrich -- --only BERT  one entry
 */
import { writeFileSync } from "node:fs";
import { ARCHITECTURES } from "../lib/architectures";
import { bucket } from "../lib/game";
import type { Arch } from "../lib/types";

const S2_DELAY = 1200; // unauthenticated Semantic Scholar allows ~1 rps
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Finding = {
  name: string;
  field: string;
  curated: string;
  observed: string;
  source: string;
  agree: boolean;
};

async function getJSON<T>(url: string, tries = 3): Promise<T | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "zeroshot-deck-audit/1.0 (research)" },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(2500 * (i + 1));
        continue;
      }
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      await sleep(1500);
    }
  }
  return null;
}

// ── 1. arXiv ────────────────────────────────────────────────────────────────
async function arxivYear(title: string): Promise<{ year: number; title: string } | null> {
  const q = encodeURIComponent(`ti:"${title}"`);
  const url = `http://export.arxiv.org/api/query?search_query=${q}&start=0&max_results=1&sortBy=relevance`;
  try {
    const xml = await (await fetch(url)).text();
    const published = /<published>(\d{4})-/.exec(xml)?.[1];
    const t = /<entry>[\s\S]*?<title>([\s\S]*?)<\/title>/.exec(xml)?.[1]?.trim();
    return published ? { year: Number(published), title: t ?? "" } : null;
  } catch {
    return null;
  }
}

// ── 2. Semantic Scholar ─────────────────────────────────────────────────────
type S2Paper = {
  title: string;
  year: number | null;
  venue: string;
  citationCount: number;
  authors: { name: string; affiliations: string[] }[];
};
async function s2(query: string): Promise<S2Paper | null> {
  const url =
    "https://api.semanticscholar.org/graph/v1/paper/search?limit=1&fields=" +
    "title,year,venue,citationCount,authors.affiliations&query=" +
    encodeURIComponent(query);
  const d = await getJSON<{ data?: S2Paper[] }>(url);
  return d?.data?.[0] ?? null;
}

// ── 3. Hugging Face ─────────────────────────────────────────────────────────
type HFModel = {
  id: string;
  downloads: number;
  safetensors?: { total?: number };
  cardData?: { license?: string };
};
async function hf(name: string): Promise<HFModel | null> {
  const list = await getJSON<HFModel[]>(
    `https://huggingface.co/api/models?search=${encodeURIComponent(name)}&sort=downloads&direction=-1&limit=1`,
  );
  const id = list?.[0]?.id;
  if (!id) return null;
  return getJSON<HFModel>(`https://huggingface.co/api/models/${id}`);
}

// ── 4. Wikidata ─────────────────────────────────────────────────────────────
async function wikidataCountry(org: string): Promise<string | null> {
  const sparql = `
    SELECT ?countryLabel WHERE {
      ?org rdfs:label "${org.replace(/"/g, "")}"@en .
      ?org wdt:P17 ?country .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 1`;
  const url =
    "https://query.wikidata.org/sparql?format=json&query=" +
    encodeURIComponent(sparql);
  const d = await getJSON<{ results: { bindings: { countryLabel: { value: string } }[] } }>(url);
  return d?.results?.bindings?.[0]?.countryLabel?.value ?? null;
}

const COUNTRY_ALIAS: Record<string, string> = {
  "United States": "USA",
  "United States of America": "USA",
  "United Kingdom": "UK",
  "People's Republic of China": "China",
  "United Arab Emirates": "UAE",
};
function normaliseCountry(c: string | null): string | null {
  return c == null ? null : (COUNTRY_ALIAS[c] ?? c);
}

// ── audit one entry ─────────────────────────────────────────────────────────
async function audit(a: Arch): Promise<Finding[]> {
  const out: Finding[] = [];
  const push = (field: string, curated: string, observed: string | null, source: string) => {
    if (observed == null) return;
    out.push({
      name: a.name,
      field,
      curated,
      observed,
      source,
      agree: curated.toLowerCase() === observed.toLowerCase(),
    });
  };

  const query = a.paper ?? a.aliases?.[0] ?? a.name;
  const ax = await arxivYear(query);
  if (ax) push("year", String(a.year), String(ax.year), `arXiv: ${ax.title.slice(0, 60)}`);

  await sleep(S2_DELAY);
  const paper = await s2(query);
  if (paper) {
    if (paper.year) push("year", String(a.year), String(paper.year), `S2: ${paper.title.slice(0, 60)}`);
    const affs = [...new Set(paper.authors.flatMap((x) => x.affiliations))].slice(0, 3);
    if (affs.length) push("org", a.org, affs.join(" | "), "S2 affiliations");
  }

  const model = await hf(a.name);
  if (model?.safetensors?.total) {
    const millions = model.safetensors.total / 1e6;
    const same = bucket(millions) === bucket(a.params);
    out.push({
      name: a.name,
      field: "params",
      curated: `${a.params ?? "null"}M`,
      observed: `${millions.toFixed(1)}M (${model.id})`,
      source: "HF safetensors",
      agree: same,
    });
  }
  if (model?.cardData?.license) {
    const open = /apache|mit|bsd|openrail|cc-by/i.test(model.cardData.license);
    push("weights", a.weights, open ? "Open" : "Partial", `HF licence: ${model.cardData.license}`);
  }

  const country = normaliseCountry(await wikidataCountry(a.org));
  push("country", a.country, country, "Wikidata P17");

  return out;
}

// ── main ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const only = args[args.indexOf("--only") + 1];
const limitArg = args.indexOf("--limit");
const limit = limitArg > -1 ? Number(args[limitArg + 1]) : Infinity;

const deck = ARCHITECTURES.filter((a) => (only ? a.name === only : true)).slice(0, limit);

const findings: Finding[] = [];
for (const [i, a] of deck.entries()) {
  process.stdout.write(`[${i + 1}/${deck.length}] ${a.name.padEnd(24)}`);
  const f = await audit(a);
  const bad = f.filter((x) => !x.agree).length;
  console.log(bad ? `  ${bad} disagreement(s)` : "  ok");
  findings.push(...f);
}

const report = {
  generatedAt: new Date().toISOString(),
  checked: deck.length,
  fields: findings.length,
  disagreements: findings.filter((f) => !f.agree).length,
  findings: findings.filter((f) => !f.agree),
};
writeFileSync("data/enrichment-report.json", JSON.stringify(report, null, 2));
console.log(
  `\n${report.disagreements} disagreements across ${report.fields} checked fields ` +
    `-> data/enrichment-report.json`,
);
