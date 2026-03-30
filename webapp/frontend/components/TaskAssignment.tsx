"use client";

import { useState } from "react";

const FEATURES = [
  {
    id: "target_encoding",
    title: "Neighbourhood Target Encoding",
    difficulty: "Medium",
    diffColor: "#f59e0b",
    chapter: "Ch.2 — Feature Engineering",
    description: "Replace one-hot encoding on the 149-value neighborhood column with target encoding. Each neighbourhood gets replaced by its mean price.",
    impact: "High — neighbourhood is the strongest local signal we're currently ignoring.",
    impactColor: "#22c55e",
    icon: "🗺️",
  },
  {
    id: "log_transform",
    title: "Log-Transform the Target",
    difficulty: "Easy",
    diffColor: "#22c55e",
    chapter: "Ch.2 — Data Preparation",
    description: "Apply log1p() to price_dh before training. Predict in log space, then expm1() to convert back to MAD.",
    impact: "Medium — reduces influence of luxury outliers (68M MAD listings) on RMSE.",
    impactColor: "#f59e0b",
    icon: "📈",
  },
  {
    id: "geo_features",
    title: "Latitude / Longitude Enrichment",
    difficulty: "Hard",
    diffColor: "#ef4444",
    chapter: "Ch.2 — Visualising Geographical Data",
    description: "Geocode each neighbourhood to get lat/lon. Add distance-to-city-centre as a feature — the Moroccan equivalent of California's ocean_proximity.",
    impact: "High — spatial features are the biggest missing piece vs. the California dataset.",
    impactColor: "#22c55e",
    icon: "📍",
  },
  {
    id: "xgboost",
    title: "XGBoost / LightGBM",
    difficulty: "Medium",
    diffColor: "#f59e0b",
    chapter: "Ch.7 — Ensemble Learning",
    description: "Replace RandomForest with gradient boosting. XGBoost typically outperforms RF on tabular data, especially with missing values.",
    impact: "Medium-High — standard for structured data competitions.",
    impactColor: "#f59e0b",
    icon: "🚀",
  },
];

export default function TaskAssignment() {
  const [selected,  setSelected]  = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const chosen = FEATURES.find((f) => f.id === selected);

  if (confirmed && chosen) {
    return (
      <div className="glass p-8 flex flex-col items-center gap-6 text-center animate-fade-in">
        <div className="text-5xl">{chosen.icon}</div>
        <div className="badge badge-green">Sprint task assigned</div>
        <h3 className="text-2xl font-bold">{chosen.title}</h3>
        <p className="text-sm max-w-md leading-relaxed" style={{ color: "#cbd5e1" }}>
          {chosen.description}
        </p>
        <div className="rounded-xl p-4 w-full max-w-sm text-left"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Your task card</p>
          <p className="text-sm font-semibold mb-1">{chosen.title}</p>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Reference: {chosen.chapter}</p>
          <div className="flex gap-2">
            <span className="badge" style={{ background: chosen.diffColor + "22", color: chosen.diffColor, border: `1px solid ${chosen.diffColor}44` }}>
              {chosen.difficulty}
            </span>
            <span className="badge" style={{ background: chosen.impactColor + "15", color: chosen.impactColor, border: `1px solid ${chosen.impactColor}33` }}>
              Impact: {chosen.impact.split(" — ")[0]}
            </span>
          </div>
        </div>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          This project was built by <span className="text-white font-medium">Mustapha Liaichi</span> at{" "}
          <a href="https://ayautomate.com" target="_blank" className="underline" style={{ color: "var(--accent)" }}>AYAutomate</a>.
          Inspired by Chapter 2 of Géron&apos;s <em>Hands-On Machine Learning</em>.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <a href="/morocco_housing_ml_report.pdf" target="_blank" rel="noopener noreferrer"
            className="btn-ghost" style={{ border: "1px solid var(--border)" }}>
            Read full ML report 📄
          </a>
          <a href="https://www.linkedin.com/in/liaichi-mustapha/" target="_blank" rel="noopener noreferrer"
            className="btn-primary">
            Connect on LinkedIn ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="glass p-5">
        <h3 className="font-bold text-base mb-1">Your turn</h3>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          You&apos;ve seen the full pipeline. Pick one extension to own for the next sprint.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelected(f.id)}
            className="text-left flex flex-col gap-3 p-5 rounded-2xl transition-all duration-200"
            style={{
              background: selected === f.id ? "rgba(14,165,233,0.10)" : "var(--surface)",
              border: `1px solid ${selected === f.id ? "rgba(14,165,233,0.45)" : "var(--border)"}`,
              transform: selected === f.id ? "translateY(-2px)" : "none",
            }}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl">{f.icon}</span>
              <span className="badge text-[10px]" style={{ background: f.diffColor + "22", color: f.diffColor, border: `1px solid ${f.diffColor}33` }}>
                {f.difficulty}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">{f.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{f.description}</p>
            </div>
            <div className="text-xs" style={{ color: f.impactColor }}>
              ↑ {f.impact}
            </div>
            <div className="text-xs" style={{ color: "var(--border)" }}>{f.chapter}</div>
          </button>
        ))}
      </div>

      <button
        className="btn-primary self-end"
        disabled={!selected}
        onClick={() => setConfirmed(true)}>
        Confirm task →
      </button>
    </div>
  );
}
