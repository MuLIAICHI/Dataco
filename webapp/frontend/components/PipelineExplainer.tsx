"use client";

import { useState } from "react";

const STEPS = [
  { n: 1, name: "Stratified Split",       code: "StratifiedShuffleSplit(test_size=0.2)",          color: "#a855f7", why: "Split on city column to preserve geographic distribution in both train and test sets." },
  { n: 2, name: "MoroccanFeatureAdder",   code: "surface_m2 / num_rooms → surface_per_room",      color: "#0ea5e9", why: "Custom transformer adding 3 ratio features before scaling. Inspired by Géron's CombinedAttributesAdder." },
  { n: 3, name: "Median Imputation",      code: "SimpleImputer(strategy='median')",                color: "#f59e0b", why: "Floor is 45% missing. We fill with the column median — safer than mean for skewed data." },
  { n: 4, name: "One-Hot Encoding",       code: "OneHotEncoder(handle_unknown='ignore')",          color: "#22c55e", why: "Encode city, state, standing as binary columns. handle_unknown='ignore' protects against new cities in future data." },
  { n: 5, name: "Standard Scaling",       code: "StandardScaler()",                               color: "#f97316", why: "Surface ranges 20–550m². Floor 0–20. Scaling puts all features on equal footing for the model." },
];

const ENGINEERED = [
  { name: "surface_per_room",     formula: "surface_m2 ÷ num_rooms",     why: "Space quality per room" },
  { name: "rooms_per_bathroom",   formula: "num_rooms ÷ num_bathrooms",   why: "Layout quality proxy" },
  { name: "surface_per_bathroom", formula: "surface_m2 ÷ num_bathrooms",  why: "Combined space + plumbing signal" },
];

export default function PipelineExplainer() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">

      {/* Pipeline flow */}
      <div className="glass p-6 flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          sklearn Pipeline — step by step
        </h3>

        {STEPS.map((step, i) => (
          <div key={step.n}>
            <button
              onClick={() => setActive(active === i ? null : i)}
              className="w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all"
              style={{
                background: active === i ? `${step.color}14` : "transparent",
                border: `1px solid ${active === i ? step.color + "44" : "transparent"}`,
              }}>
              {/* Step number */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: step.color + "22", color: step.color, border: `1px solid ${step.color}44` }}>
                {step.n}
              </div>
              {/* Name + code */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{step.name}</p>
                <code className="code-pill text-xs">{step.code}</code>
              </div>
              <span style={{ color: "var(--muted)" }}>{active === i ? "▲" : "▼"}</span>
            </button>

            {/* Expanded explanation */}
            {active === i && (
              <div className="mx-4 mb-2 px-4 py-3 rounded-xl text-sm animate-fade-in"
                style={{ background: `${step.color}0d`, border: `1px solid ${step.color}22`, color: "#cbd5e1" }}>
                <span className="font-semibold" style={{ color: step.color }}>Why: </span>
                {step.why}
              </div>
            )}

            {/* Connector arrow */}
            {i < STEPS.length - 1 && (
              <div className="flex justify-center py-0.5">
                <span style={{ color: "var(--border)", fontSize: 18 }}>↓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Engineered features */}
      <div className="glass p-6 flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Engineered features — MoroccanFeatureAdder
        </h3>
        <div className="flex flex-col gap-2">
          {ENGINEERED.map((f) => (
            <div key={f.name} className="flex items-center gap-4 p-3 rounded-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <code className="code-pill shrink-0">{f.name}</code>
              <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{f.formula}</span>
              <span className="text-xs ml-auto" style={{ color: "#93c5fd" }}>{f.why}</span>
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Inspired by Géron&apos;s <em>CombinedAttributesAdder</em> — ratio features often reveal more signal than raw counts.
        </p>
      </div>
    </div>
  );
}
