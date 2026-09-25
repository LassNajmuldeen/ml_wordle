import { Game } from "@/components/Game";
import { ARCHITECTURES } from "@/lib/architectures";
import type { Candidate } from "@/lib/shared";

/**
 * Server component: it reads the deck but hands the browser only names,
 * aliases and years for autocomplete. Grading happens in /api/guess.
 */
export default function Page() {
  const candidates: Candidate[] = ARCHITECTURES.map((a) => ({
    name: a.name,
    aliases: a.aliases ?? [],
    year: a.year,
  })).sort((x, y) => x.name.localeCompare(y.name));
  return <Game candidates={candidates} />;
}
