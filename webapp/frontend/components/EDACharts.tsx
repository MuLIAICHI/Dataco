"use client";

import { useState } from "react";
import Image from "next/image";

const CHARTS = [
  { id: "chart1_city_counts",   title: "Listings per City",               insight: "Casablanca dominates with 215 listings. Oujda is the smallest market — only 99 entries." },
  { id: "chart2_price_hist",    title: "Price Distribution",              insight: "Right-skewed. Median is 1.25M MAD but the tail stretches to 68M MAD (luxury villas). This is why we log-transform in the online pipeline." },
  { id: "chart3_price_surface", title: "Price vs. Surface by City",       insight: "Surface area is the strongest predictor — but city matters too. A 100m² flat in Casablanca costs significantly more than one in Oujda." },
  { id: "chart4_correlations",  title: "Feature Correlations with Price", insight: "surface_m2 leads at 0.62. Our engineered features (surface_per_room, surface_per_bathroom) add signal beyond raw counts." },
];

export default function EDACharts() {
  const [active, setActive] = useState(0);
  const chart = CHARTS[active];

  return (
    <div className="flex flex-col gap-5">

      {/* Tab navigation */}
      <div className="flex gap-2 flex-wrap">
        {CHARTS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActive(i)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: i === active ? "rgba(14,165,233,0.15)" : "var(--surface)",
              color:      i === active ? "var(--accent)" : "var(--muted)",
              border:     `1px solid ${i === active ? "rgba(14,165,233,0.35)" : "var(--border)"}`,
            }}>
            {c.title}
          </button>
        ))}
      </div>

      {/* Chart display */}
      <div className="glass p-4 flex flex-col gap-4 animate-fade-in" key={chart.id}>
        <div className="relative w-full rounded-xl overflow-hidden"
          style={{ background: "white", minHeight: "280px" }}>
          <Image
            src={`/charts/${chart.id}.png`}
            alt={chart.title}
            fill
            className="object-contain p-2"
            unoptimized
          />
        </div>

        {/* Insight callout */}
        <div className="rounded-xl p-4 flex gap-3"
          style={{ background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.18)" }}>
          <span className="text-xl shrink-0">💡</span>
          <p className="text-sm leading-relaxed" style={{ color: "#93c5fd" }}>
            <span className="font-semibold text-white">Key insight: </span>
            {chart.insight}
          </p>
        </div>
      </div>

      {/* Three findings summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: "🏙️", title: "City premium",    body: "Casablanca commands a per-m² price that no other city matches." },
          { icon: "📐", title: "Surface matters", body: "Strongest numeric predictor with a 0.62 Pearson correlation." },
          { icon: "⚠️", title: "Missing data",    body: "78% of 'standing' is blank. Real scraped data is never clean." },
        ].map((f) => (
          <div key={f.title} className="metric-card p-4 flex flex-col gap-2">
            <span className="text-xl">{f.icon}</span>
            <p className="text-sm font-semibold">{f.title}</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
