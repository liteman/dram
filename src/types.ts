// ---- Sources ----
export interface FeedSource {
  id: string;
  name: string;
  type: "rss" | "api" | "web";
  url: string;
  category: SignalCategory;
}

export type SignalCategory =
  | "security_training"
  | "ai_dev_tools"
  | "crypto_rwa";

// ---- Pipeline ----
export interface RawItem {
  sourceId: string;
  sourceName: string;
  category: SignalCategory;
  url: string;
  title: string;
  summary: string;
  publishedAt: string;
}

export type ScoreLevel = "ignore" | "watch" | "act_now";

export interface ScoredItem extends RawItem {
  score: ScoreLevel;
  scoreReason: string;
}

export interface AnalyzedItem extends ScoredItem {
  whatHappened: string;
  whyItMatters: string;
  whatsTheMove: string;
}
