"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };

const STEP_INTROS: Record<string, string> = {
  welcome:         "Welcome to DataCo Morocco! I'm Nour, your mentor for this internship. We've been working on a fascinating project — predicting apartment prices across Morocco. Let me walk you through everything we've built.",
  dataset:         "This is your first task as a data scientist: understand your data before touching any model. We scraped 1,194 listings from Mubawab.ma. After cleaning? 1,058 usable apartments across 7 cities. Let's see what the data tells us.",
  eda:             "Exactement — this is where it gets interesting. Three things jumped out immediately when I first explored this dataset. See if you can spot them too.",
  pipeline:        "Now we build the machine. A good sklearn Pipeline means no data leakage, no manual steps, no mistakes. This is how production ML is done.",
  models:          "Three models, one winner. But the results might surprise you — it's not as clear-cut as you'd expect with only 1,058 rows.",
  online_learning: "Here's what we did next — and this is the part most interns don't see in textbooks. The Apify scraper keeps running. Why retrain from scratch every time?",
  live_demo:       "This is live. Click the button and watch the model update in real time on new listings. This is online learning — Géron Chapter 1, applied to Moroccan real estate.",
  assignment:      "Très bien — you've seen the full project. Now it's your turn. Choose one of these extensions and it becomes your next sprint task. What are you most curious about?",
};

export default function MentorBubble({ stepId }: { stepId: string }) {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [open, setOpen]               = useState(false);
  const [questionsUsed, setQuestions] = useState(0);
  const QUESTION_LIMIT                = 2;
  const limitReached                  = questionsUsed >= QUESTION_LIMIT;
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset + show step intro whenever step changes
  useEffect(() => {
    setMessages([{ role: "assistant", content: STEP_INTROS[stepId] ?? "Let's keep going — any questions?" }]);
    setOpen(false);
  }, [stepId]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    if (!input.trim() || loading || limitReached) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const { reply } = await api.mentor.chat(userMsg, stepId, messages);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setQuestions((n) => n + 1);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I'm having connection issues. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  const intro = messages[0]?.content ?? "";

  return (
    <div className="mentor-bubble p-5 flex flex-col gap-3">
      {/* Mentor header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.35)" }}>
            N
          </div>
          <div>
            <p className="text-sm font-semibold">Nour</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Senior Data Scientist · DataCo Morocco</p>
          </div>
        </div>
        <button onClick={() => setOpen((o) => !o)}
          className="text-xs px-3 py-1 rounded-lg transition-colors"
          style={{ background: "rgba(14,165,233,0.1)", color: "var(--accent)", border: "1px solid rgba(14,165,233,0.2)" }}>
          {open ? "Close chat" : "Ask Nour"}
        </button>
      </div>

      {/* Step intro — always visible */}
      <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>{intro}</p>

      {/* Chat panel — toggled */}
      {open && (
        <div className="flex flex-col gap-3 border-t pt-3 mt-1" style={{ borderColor: "rgba(56,189,248,0.12)" }}>
          {/* Message history (skip the first intro) */}
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {messages.slice(1).map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
                  style={{
                    background: m.role === "user" ? "rgba(14,165,233,0.18)" : "rgba(255,255,255,0.05)",
                    color: m.role === "user" ? "#e0f2fe" : "#cbd5e1",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl text-sm" style={{ color: "var(--muted)", background: "rgba(255,255,255,0.04)" }}>
                  Nour is typing…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Usage counter */}
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
            <span>Questions used</span>
            <span className={questionsUsed >= QUESTION_LIMIT ? "text-red-400 font-semibold" : ""}>
              {questionsUsed} / {QUESTION_LIMIT}
            </span>
          </div>

          {/* Input */}
          {limitReached ? (
            <div className="rounded-xl px-4 py-3 text-sm text-center"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
              You&apos;ve used your 2 questions with Nour. Continue the walkthrough to see the full project!
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(56,189,248,0.18)", color: "var(--text)" }}
                placeholder={`Ask Nour anything… (${QUESTION_LIMIT - questionsUsed} left)`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button onClick={send} disabled={loading || !input.trim()} className="btn-primary px-4 py-2 text-sm">
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
