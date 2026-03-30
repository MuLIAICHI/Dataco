const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = rawApiBase.replace(/\/+$/, "");

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  data: {
    overview:     () => get("/api/data/overview"),
    features:     () => get("/api/data/features"),
    correlations: () => get("/api/data/correlations"),
    charts:       () => get("/api/data/charts"),
  },
  model: {
    results:       () => get("/api/model/results"),
    pipeline:      () => get("/api/model/pipeline"),
    state:         () => get("/api/model/state"),
    benchmark:     () => post("/api/model/benchmark"),
    partialFit:    () => post("/api/model/partial-fit"),
    nextFeatures:  () => get("/api/model/next-features"),
  },
  mentor: {
    intro: (step: string) => get(`/api/mentor/intro/${step}`),
    chat:  (message: string, step?: string, history?: object[]) =>
      post<{ reply: string; mentor: string }>("/api/mentor/chat", { message, step, history }),
  },
};

export type ChartMeta   = { id: string; title: string; file: string };
export type StepIntro   = { step: string; text: string };
export type ModelResult = { cv_rmse_mean: number; cv_rmse_std: number };
export type BenchmarkResult = {
  status: string;
  sgd: { rmse: number; mae: number; r2: number; rmse_pct_median: number };
  random_forest: { rmse: number; mae: number; r2: number; rmse_pct_median: number };
  winner: string;
};
export type NextFeature = {
  id: string; title: string; difficulty: string;
  description: string; expected_impact: string; chapter_ref: string;
};
export type PartialFitResult = {
  status: string; run_number: number; new_rows_trained: number;
  metrics: { rmse: number; rmse_pct_median: number; r2: number };
  total_rows_seen: number; message: string;
};
