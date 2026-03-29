"use client";

import { useState } from "react";
import StepProgress   from "@/components/StepProgress";
import MentorBubble   from "@/components/MentorBubble";
import DatasetOverview from "@/components/DatasetOverview";
import EDACharts       from "@/components/EDACharts";
import PipelineExplainer from "@/components/PipelineExplainer";
import ModelShowdown   from "@/components/ModelShowdown";
import OnlineLearning  from "@/components/OnlineLearning";
import LiveDemo        from "@/components/LiveDemo";
import TaskAssignment  from "@/components/TaskAssignment";

export type Step = {
  id:    string;
  label: string;
};

const STEPS: Step[] = [
  { id: "welcome",        label: "Welcome"       },
  { id: "dataset",        label: "The Dataset"   },
  { id: "eda",            label: "Exploration"   },
  { id: "pipeline",       label: "Pipeline"      },
  { id: "models",         label: "Models"        },
  { id: "online_learning",label: "Online Learning"},
  { id: "live_demo",      label: "Live Demo"     },
  { id: "assignment",     label: "Your Task"     },
];

export default function InternshipPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];
  const isLast  = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  const next = () => !isLast  && setCurrentStep((s) => s + 1);
  const prev = () => !isFirst && setCurrentStep((s) => s - 1);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b px-6 py-3 flex items-center justify-between"
        style={{ background: "rgba(10,15,30,0.85)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}>
        <a href="/" className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--accent)" }}>
          ◈ DataCo Morocco
        </a>
        <StepProgress steps={STEPS} currentStep={currentStep} onSelect={setCurrentStep} />
        <span className="text-xs hidden sm:block" style={{ color: "var(--muted)" }}>
          Step {currentStep + 1} / {STEPS.length}
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">

        {/* Mentor bubble — always visible */}
        <MentorBubble stepId={step.id} />

        {/* Step content */}
        <div className="animate-fade-in" key={step.id}>
          {step.id === "welcome"         && <WelcomeStep />}
          {step.id === "dataset"         && <DatasetOverview />}
          {step.id === "eda"             && <EDACharts />}
          {step.id === "pipeline"        && <PipelineExplainer />}
          {step.id === "models"          && <ModelShowdown />}
          {step.id === "online_learning" && <OnlineLearning />}
          {step.id === "live_demo"       && <LiveDemo />}
          {step.id === "assignment"      && <TaskAssignment />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button className="btn-ghost" onClick={prev} disabled={isFirst}>
            ← Back
          </button>
          {!isLast ? (
            <button className="btn-primary" onClick={next}>
              Continue →
            </button>
          ) : (
            <a href="https://www.linkedin.com/in/liaichi-mustapha/" target="_blank" rel="noopener noreferrer"
              className="btn-primary">
              Connect with Mustapha ↗
            </a>
          )}
        </div>
      </main>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="glass p-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ background: "var(--accent-lo)", border: "1px solid rgba(14,165,233,0.3)" }}>
          🇲🇦
        </div>
        <div>
          <h2 className="text-xl font-bold">Welcome to DataCo Morocco</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Junior Data Scientist — Day 1</p>
        </div>
      </div>

      <p style={{ color: "var(--muted)", lineHeight: 1.75 }}>
        Your team has been building a machine learning pipeline to predict apartment prices
        across Morocco using data scraped from{" "}
        <a href="https://mubawab.ma" target="_blank" className="underline" style={{ color: "var(--accent)" }}>
          Mubawab.ma
        </a>
        . This walkthrough follows the exact methodology from Chapter 2 of Géron&apos;s{" "}
        <em>Hands-On Machine Learning</em> — applied to real Moroccan data.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: "🏙️", label: "7 cities" },
          { icon: "🏠", label: "1,058 listings" },
          { icon: "🤖", label: "3 models" },
          { icon: "📡", label: "Online learning" },
        ].map((item) => (
          <div key={item.label} className="metric-card p-4 flex flex-col items-center gap-2 text-center">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <span className="font-semibold" style={{ color: "var(--accent)" }}>Built with: </span>
        <span style={{ color: "var(--muted)" }}>
          Python · scikit-learn · Apify · FastAPI · Next.js · Claude API
        </span>
      </div>
    </div>
  );
}
