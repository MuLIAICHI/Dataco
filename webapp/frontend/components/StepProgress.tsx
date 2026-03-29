"use client";

import type { Step } from "@/app/internship/page";

type Props = { steps: Step[]; currentStep: number; onSelect: (i: number) => void };

export default function StepProgress({ steps, currentStep, onSelect }: Props) {
  return (
    <nav className="hidden md:flex items-center gap-1">
      {steps.map((step, i) => {
        const done    = i < currentStep;
        const active  = i === currentStep;
        return (
          <button
            key={step.id}
            onClick={() => onSelect(i)}
            title={step.label}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              color:      active ? "var(--accent)" : done ? "#4ade80" : "var(--muted)",
              background: active ? "rgba(14,165,233,0.12)" : "transparent",
            }}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                background: active ? "var(--accent)"
                          : done   ? "#22c55e"
                          :          "var(--border)",
                color: active || done ? "white" : "var(--muted)",
                minWidth: "16px",
              }}>
              {done ? "✓" : i + 1}
            </span>
            <span className="hidden lg:inline">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
