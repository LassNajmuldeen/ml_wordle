export type Modality =
  | "Vision" | "Language" | "Audio" | "Video"
  | "Graph" | "Tabular" | "Control" | "Biology" | "Weather";

export type Mechanism =
  | "Convolution" | "Recurrence" | "State space" | "Self-attention"
  | "MLP" | "Graph message passing" | "Kernel machine"
  | "Tree ensemble" | "Energy-based" | "Hybrid";

export type Paradigm =
  | "Supervised" | "Autoregressive" | "Masked modeling" | "Contrastive"
  | "Self-distillation" | "Reconstruction" | "Diffusion" | "Adversarial"
  | "Normalizing flow" | "Variational" | "Reinforcement learning";

export type Weights = "Open" | "Partial" | "Closed";

export type Arch = {
  name: string;
  aliases?: string[];
  /** exact paper title — pins arXiv/S2 lookups so the audit can't match a lookalike */
  paper?: string;
  year: number;
  modality: Modality[];
  mechanism: Mechanism;
  paradigm: Paradigm;
  org: string;
  /** flagship-variant parameter count, in millions; null = never disclosed */
  params: number | null;
  weights: Weights;
  parents: string[];
  blurb: string;
  /** 1 = can be the daily answer, 2 = guessable only */
  tier: 1 | 2;
  /**
   * First daily puzzle this entry can be the answer to. Adding answers
   * reshuffles the order, so new entries only join from a future day and
   * nobody's in-progress game changes answer underneath them.
   */
  from?: number;
  /** Last daily puzzle before this entry retires from the rotation (still guessable). */
  until?: number;
};
