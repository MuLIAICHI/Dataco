"use client";

const FLOW = [
  { icon: "🕷️", label: "Apify actor runs",        detail: "Scrapes new listings from Mubawab.ma on demand" },
  { icon: "☁️", label: "Data lands in cloud",      detail: "Appended to the mubawab-housing Apify Dataset" },
  { icon: "🔌", label: "API fetch (offset-based)", detail: "Only new rows pulled — offset tracked in state.json" },
  { icon: "🧹", label: "Clean batch",              detail: "Deduplication, filter vente/unknown, drop missing targets" },
  { icon: "⚗️", label: "Frozen preprocessor",     detail: "Fit once on cold start — never re-fitted on new data" },
  { icon: "📡", label: "partial_fit(X, y)",        detail: "SGDRegressor updates its weights on new listings only" },
  { icon: "💾", label: "Save model state",         detail: "model.joblib + state.json updated. Offset advances." },
];

export default function OnlineLearning() {
  return (
    <div className="flex flex-col gap-6">

      {/* Concept card */}
      <div className="glass p-6 flex flex-col gap-3">
        <h3 className="font-bold text-lg">Why Online Learning?</h3>
        <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
          The Apify scraper keeps running — new listings arrive every time it&apos;s triggered.
          With a batch model like Random Forest, you&apos;d retrain from scratch each time.
          With <code className="code-pill">SGDRegressor.partial_fit()</code>, the model
          updates incrementally on new data only. No old data needed. No full retrain.
        </p>
        <div className="flex gap-3 mt-1">
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-xs font-semibold text-red-400 mb-1">Batch (Random Forest)</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Retrain all 1,058 rows every run</p>
          </div>
          <div className="flex items-center text-xl" style={{ color: "var(--muted)" }}>→</div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <p className="text-xs font-semibold text-green-400 mb-1">Online (SGDRegressor)</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Train only on ~40 new rows per run</p>
          </div>
        </div>
      </div>

      {/* Architecture flow */}
      <div className="glass p-6 flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          Pipeline flow — each Apify trigger
        </h3>
        {FLOW.map((step, i) => (
          <div key={step.label}>
            <div className="flex items-start gap-4 p-3 rounded-xl" style={{ background: "var(--surface)" }}>
              <span className="text-xl shrink-0">{step.icon}</span>
              <div>
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{step.detail}</p>
              </div>
            </div>
            {i < FLOW.length - 1 && (
              <div className="flex justify-center py-0.5">
                <span style={{ color: "var(--border)", fontSize: 16 }}>↓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key point */}
      <div className="rounded-xl p-4 text-sm flex gap-3"
        style={{ background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.2)" }}>
        <span className="text-lg shrink-0">📖</span>
        <p style={{ color: "#93c5fd" }}>
          <span className="font-semibold text-white">Géron reference: </span>
          Chapter 1 — Types of Learning Systems. Online learning vs. batch learning.
          The key constraint: the preprocessor (imputer + OHE) is <strong>fit once</strong> and frozen.
          Only the model weights update with each new batch.
        </p>
      </div>
    </div>
  );
}
