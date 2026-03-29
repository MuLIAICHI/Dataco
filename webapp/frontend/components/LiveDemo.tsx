"use client";

import { useState } from "react";
import { api, type PartialFitResult, type BenchmarkResult } from "@/lib/api";

export default function LiveDemo() {
  const [fitResult,       setFitResult]       = useState<PartialFitResult | null>(null);
  const [benchResult,     setBenchResult]      = useState<BenchmarkResult | null>(null);
  const [loadingFit,      setLoadingFit]       = useState(false);
  const [loadingBench,    setLoadingBench]     = useState(false);
  const [runCount,        setRunCount]         = useState(0);

  async function triggerPartialFit() {
    setLoadingFit(true);
    try {
      const res = await api.model.partialFit() as PartialFitResult;
      setFitResult(res);
      setRunCount((n) => n + 1);
    } finally {
      setLoadingFit(false);
    }
  }

  async function triggerBenchmark() {
    setLoadingBench(true);
    try {
      const res = await api.model.benchmark() as BenchmarkResult;
      setBenchResult(res);
    } finally {
      setLoadingBench(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="glass p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base">Live Online Learning</h3>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Each click simulates a new Apify scrape — watch the model update in real time.
          </p>
        </div>
        <div className="badge badge-green animate-pulse-slow">● Live</div>
      </div>

      {/* partial_fit trigger */}
      <div className="glass p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Trigger incremental update</h4>
          <code className="code-pill">SGDRegressor.partial_fit()</code>
        </div>

        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Simulates a new batch of ~41 fresh Mubawab listings arriving from Apify.
          The frozen preprocessor transforms them, then <code className="code-pill">partial_fit()</code> updates
          the model weights — without touching the 1,058 original listings.
        </p>

        <button className="btn-primary self-start" onClick={triggerPartialFit} disabled={loadingFit}>
          {loadingFit ? "Training…" : `▶ Run partial_fit() ${runCount > 0 ? `(run #${runCount + 1})` : ""}`}
        </button>

        {fitResult && (
          <div className="rounded-xl p-4 flex flex-col gap-3 animate-fade-in"
            style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <p className="text-xs font-semibold text-green-400">
              ✓ {fitResult.message}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "RMSE",         value: `${(fitResult.metrics.rmse / 1e6).toFixed(2)}M MAD` },
                { label: "% of median",  value: `${fitResult.metrics.rmse_pct_median}%` },
                { label: "R²",           value: fitResult.metrics.r2.toFixed(3) },
              ].map((m) => (
                <div key={m.label} className="rounded-lg p-3 text-center"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-base font-bold mt-1" style={{ color: "var(--accent)" }}>{m.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Total rows trained on: <span className="font-mono text-white">{fitResult.total_rows_seen.toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>

      {/* Benchmark trigger */}
      <div className="glass p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Benchmark: Online vs. Batch</h4>
          <code className="code-pill">--benchmark</code>
        </div>

        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Evaluates the live SGDRegressor against a freshly trained Random Forest
          on the same held-out test set (20% stratified by city).
        </p>

        <button className="btn-ghost self-start" onClick={triggerBenchmark} disabled={loadingBench}>
          {loadingBench ? "Running…" : "⚖ Run benchmark"}
        </button>

        {benchResult && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "SGDRegressor (online)", metrics: benchResult.sgd, color: "#0ea5e9", winner: benchResult.winner === "sgd" },
                { label: "Random Forest (batch)", metrics: benchResult.random_forest, color: "#22c55e", winner: benchResult.winner === "random_forest" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl p-4 flex flex-col gap-2"
                  style={{ background: "var(--surface)", border: `1px solid ${m.winner ? m.color + "55" : "var(--border)"}` }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: m.color }}>{m.label}</p>
                    {m.winner && <span className="badge badge-green text-[10px]">Winner</span>}
                  </div>
                  <p className="text-lg font-bold">{(m.metrics.rmse / 1e6).toFixed(2)}M</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>RMSE · R² {m.metrics.r2.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
              Keep triggering partial_fit() above — watch the gap narrow over time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
