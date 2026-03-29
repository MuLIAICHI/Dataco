"use client";

import Image from "next/image";

const MODELS = [
  { name: "Linear Regression", rmse: 2.90, std: 2.18, r2: null,  color: "#94a3b8", verdict: "Decent mean, but massive variance across folds. Unstable." },
  { name: "Decision Tree",     rmse: 5.45, std: 1.52, r2: null,  color: "#f97316", verdict: "Overfits the training data. Worst performer overall." },
  { name: "Random Forest ✓",   rmse: 3.55, std: 1.99, r2: 0.664, color: "#22c55e", verdict: "Best mean RMSE and most stable. Winner." },
];

const maxRmse = Math.max(...MODELS.map((m) => m.rmse));

export default function ModelShowdown() {
  return (
    <div className="flex flex-col gap-6">

      {/* Chart image */}
      <div className="glass p-4">
        <div className="relative w-full rounded-xl overflow-hidden" style={{ background: "white", minHeight: "260px" }}>
          <Image
            src="/charts/chart5_model_comparison.png"
            alt="Model comparison"
            fill className="object-contain p-2" unoptimized />
        </div>
      </div>

      {/* Model cards */}
      <div className="flex flex-col gap-3">
        {MODELS.map((m) => (
          <div key={m.name} className="glass p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{m.name}</h3>
              {m.r2 !== null && <span className="badge badge-green">R² = {m.r2}</span>}
            </div>

            {/* RMSE bar */}
            <div>
              <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
                <span>CV RMSE (mean)</span>
                <span className="font-mono">{m.rmse}M MAD ± {m.std}M</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(m.rmse / maxRmse) * 100}%`, background: m.color, opacity: 0.8 }} />
              </div>
            </div>

            <p className="text-xs" style={{ color: "var(--muted)" }}>{m.verdict}</p>
          </div>
        ))}
      </div>

      {/* Context box */}
      <div className="rounded-xl p-4 text-sm flex gap-3"
        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <span className="text-lg shrink-0">⚠️</span>
        <p style={{ color: "#fcd34d" }}>
          <span className="font-semibold">Why is RMSE so high? </span>
          <span style={{ color: "#fde68a", fontWeight: 400 }}>
            Outlier listings (some above 10M MAD) inflate RMSE. No lat/lon means the model can&apos;t learn
            neighbourhood-level price gradients. And 78% of the &apos;standing&apos; quality column is missing.
            Despite this, the pipeline validates: city and surface area are genuine predictors.
          </span>
        </p>
      </div>
    </div>
  );
}
