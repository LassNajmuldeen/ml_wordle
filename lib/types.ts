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
};
