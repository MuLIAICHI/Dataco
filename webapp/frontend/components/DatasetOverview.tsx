"use client";

const CITY_DATA = [
  { city: "Casablanca", count: 215, color: "#ef4444" },
  { city: "Tanger",     count: 198, color: "#22c55e" },
  { city: "Meknès",     count: 198, color: "#14b8a6" },
  { city: "Marrakech",  count: 192, color: "#f97316" },
  { city: "Rabat",      count: 160, color: "#3b82f6" },
  { city: "Agadir",     count: 132, color: "#a855f7" },
  { city: "Oujda",      count:  99, color: "#f59e0b" },
];

const FEATURES = [
  { name: "city",            type: "Categorical", missing: "0%",   note: "7 cities — geographic backbone of the model" },
  { name: "surface_m2",      type: "Numeric",     missing: "<1%",  note: "Apartment area in square metres" },
  { name: "num_rooms",       type: "Numeric",     missing: "7%",   note: "Total number of rooms" },
  { name: "num_bathrooms",   type: "Numeric",     missing: "3%",   note: "Number of bathrooms" },
  { name: "floor",           type: "Numeric",     missing: "45%",  note: "Floor level — sellers often omit this" },
  { name: "state",           type: "Categorical", missing: "1%",   note: "New build, good condition, to renovate…" },
  { name: "standing",        type: "Categorical", missing: "78%",  note: "High-end vs mid-range — mostly missing" },
  { name: "price_dh ★",     type: "Target",      missing: "10%",  note: "Listed price in Moroccan Dirham" },
];

const maxCount = Math.max(...CITY_DATA.map((d) => d.count));

export default function DatasetOverview() {
  return (
    <div className="flex flex-col gap-6">

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { value: "1,194", label: "raw rows",       sub: "scraped from Mubawab.ma" },
          { value: "1,058", label: "clean listings", sub: "after deduplication + cleaning" },
          { value: "7",     label: "cities",         sub: "Casablanca to Oujda" },
          { value: "1.25M", label: "median price",   sub: "Moroccan Dirham (MAD)" },
        ].map((s) => (
          <div key={s.label} className="metric-card p-4 flex flex-col gap-1">
            <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{s.value}</span>
            <span className="text-sm font-medium">{s.label}</span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* City bar chart */}
      <div className="glass p-6 flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Listings per city
        </h3>
        <div className="flex flex-col gap-2">
          {CITY_DATA.map((d) => (
            <div key={d.city} className="flex items-center gap-3">
              <span className="text-xs w-24 text-right font-medium" style={{ color: "#cbd5e1" }}>{d.city}</span>
              <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: "var(--surface)" }}>
                <div className="h-full rounded-lg transition-all duration-700"
                  style={{ width: `${(d.count / maxCount) * 100}%`, background: d.color, opacity: 0.8 }} />
              </div>
              <span className="text-xs w-8 font-mono" style={{ color: "var(--muted)" }}>{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature table */}
      <div className="glass overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Dataset features
          </h3>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {FEATURES.map((f) => (
            <div key={f.name} className="px-6 py-3 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
              <code className="code-pill mt-0.5 shrink-0">{f.name}</code>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "#cbd5e1" }}>{f.note}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`badge ${f.type === "Target" ? "badge-green" : f.type === "Categorical" ? "badge-blue" : "badge-orange"}`}>
                  {f.type}
                </span>
                <span className={`text-xs font-mono ${parseFloat(f.missing) > 40 ? "text-red-400" : parseFloat(f.missing) > 5 ? "text-yellow-400" : ""}`}
                  style={{ color: parseFloat(f.missing) <= 5 ? "var(--muted)" : undefined }}>
                  {f.missing}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
