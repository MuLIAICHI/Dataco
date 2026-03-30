"use client";

import { useRouter } from "next/navigation";

const CITIES = ["Casablanca", "Marrakech", "Rabat", "Tanger", "Agadir", "Meknès", "Oujda"];

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">

      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(14,165,233,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(14,165,233,0.04) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute top-[-120px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-3xl w-full text-center flex flex-col items-center gap-8">

        {/* Badge */}
        <div className="badge badge-blue text-xs tracking-widest">
          ◈ INTERACTIVE SHOWCASE · AYAutomate
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight">
          Your first day at{" "}
          <span style={{ color: "var(--accent)" }}>DataCo Morocco</span>
        </h1>

        <p className="text-lg max-w-xl" style={{ color: "var(--muted)" }}>
          You just joined as a junior data scientist. Your team has been building
          an ML pipeline to predict apartment prices across 7 Moroccan cities.
          Nour — your mentor — will walk you through everything.
        </p>

        {/* City pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {CITIES.map((c) => (
            <span key={c} className="badge badge-blue">{c}</span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
          {[
            { value: "1,058", label: "listings scraped" },
            { value: "3",     label: "models benchmarked" },
            { value: "∞",     label: "online learning" },
          ].map((s) => (
            <div key={s.label} className="metric-card p-4 flex flex-col items-center gap-1">
              <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                {s.value}
              </span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          className="btn-primary text-base px-10 py-3 mt-2"
          onClick={() => router.push("/internship")}
        >
          Start your internship →
        </button>

        <div className="flex flex-col items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
          <p>No sign-up required · ~8 min walkthrough · Data from Mubawab.ma</p>
          <a
            href="/morocco_housing_ml_report.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors"
          >
            Read the full ML report
          </a>
        </div>
      </div>
    </main>
  );
}
