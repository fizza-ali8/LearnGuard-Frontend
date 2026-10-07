"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/display";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const ANALYSIS_STEPS = [
  "Preparing input",
  "Checking input quality",
  "Running screening analysis",
  "Preparing explanation",
  "Finalizing result",
];

export function useUnsavedWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [active]);
}

export function AssessmentStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="mb-6 flex flex-wrap gap-3" aria-label="Assessment progress">
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                state === "done" && "bg-primary text-white",
                state === "current" && "bg-primary-soft text-primary-dark ring-1 ring-lavender-border",
                state === "upcoming" && "bg-soft text-faint",
              )}
            >
              {state === "done" ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className={cn("text-sm", state === "current" ? "font-semibold text-heading" : "text-muted")}>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function AnalysisScreen({
  title,
  steps,
  onDone,
}: {
  title: string;
  steps: string[];
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (index >= steps.length) {
      const timer = setTimeout(() => done.current(), 500);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setIndex((value) => value + 1), 750);
    return () => clearTimeout(timer);
  }, [index, steps.length]);

  return (
    <Card className="mx-auto max-w-xl">
      <h2 className="text-xl font-bold text-heading">{title}</h2>
      <p className="mt-1 text-sm text-muted">This may take a few moments.</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-soft">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(index, steps.length) / steps.length) * 100}%` }} />
      </div>
      <ul className="mt-6 space-y-3">
        {steps.map((step, stepIndex) => {
          const state = stepIndex < index ? "done" : stepIndex === index ? "active" : "wait";
          return (
            <li key={step} className="flex items-center gap-3 text-sm">
              {state === "done" ? (
                <Check className="h-4 w-4 text-risk-low" />
              ) : state === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <span className="h-4 w-4 rounded-full border border-line" />
              )}
              <span className={state === "wait" ? "text-faint" : "text-heading"}>{step}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function Waveform({ active }: { active?: boolean }) {
  const bars = [8, 14, 22, 16, 28, 18, 32, 20, 12, 26, 18, 30, 14, 22, 10, 24, 16, 28, 12, 20, 26, 14, 18, 30];
  return (
    <div className="flex h-16 items-center justify-center gap-1" aria-hidden>
      {bars.map((height, index) => (
        <span
          key={index}
          className={cn("w-1.5 rounded-full bg-primary/80", active && "animate-pulse")}
          style={{ height, animationDelay: `${index * 40}ms` }}
        />
      ))}
    </div>
  );
}

export function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ConsentRequired({ name }: { name: string }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-heading">Consent required</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Guardian consent has not been verified for {name}. Confirm consent on the student record before a screening sample is collected.
      </p>
    </Card>
  );
}

export function StudentSummary({ name, code, grade }: { name: string; code: string; grade: string }) {
  return (
    <div className="mb-5 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-heading">{name}</p>
        <p className="text-xs text-faint">{code} · Grade {grade}</p>
      </div>
      <Button variant="tertiary" size="sm" onClick={() => window.history.back()}>
        Back
      </Button>
    </div>
  );
}
