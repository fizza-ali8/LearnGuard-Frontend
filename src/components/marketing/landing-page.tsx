"use client";

import { ScreeningDisclaimer } from "@/components/brand/logo";
import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/display";
import { RiskBadge, RiskBar } from "@/components/ui/risk";
import { BookOpen, Eye, LockKeyhole, Mic, PenLine, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

const steps = [
  { n: "01", title: "Collect", body: "Audio, handwriting and a caregiver questionnaire." },
  { n: "02", title: "Analyze", body: "Specialized screening models process each input." },
  { n: "03", title: "Support", body: "Teachers receive risk insights, explanations and next-step guidance." },
];

const modules = [
  {
    icon: Mic,
    title: "Dyslexia Screening",
    kicker: "Oral Reading + Language",
    body: "Analyze reading fluency, omissions, timing and linguistic patterns.",
  },
  {
    icon: PenLine,
    title: "Dysgraphia Screening",
    kicker: "Handwriting Analysis",
    body: "Evaluate spatial handwriting patterns and visually explain influential regions.",
  },
  {
    icon: Eye,
    title: "ADHD-Related Screening",
    kicker: "Caregiver Questionnaire",
    body: "Uses caregiver-reported information about attention, school functioning, social behaviour, sleep, routines and activities.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,124,246,0.14),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="text-sm font-medium text-primary-dark">Early learning screening</p>
            <h1 className="mt-4 max-w-xl text-5xl leading-[1.05] font-bold text-heading md:text-6xl">
              Earlier insight.
              <br />
              Better support.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-body">
              LearnGuard helps educators identify early learning-risk indicators through multimodal AI screening and clear, explainable insights.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button>Open Dashboard</Button>
              </Link>
              <Link href="/#how-it-works">
                <Button variant="secondary">See How It Works</Button>
              </Link>
            </div>
            <ScreeningDisclaimer className="mt-6 max-w-lg" />
          </div>
          <Card className="shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-heading">Amina Rahman</p>
                <p className="text-xs text-faint">Grade 4 · LG-2026-001</p>
              </div>
              <RiskBadge level="elevated" phrase />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Dyslexia", "72%"],
                ["Dysgraphia", "31%"],
                ["ADHD-related", "58%"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-soft px-3 py-3">
                  <p className="text-[11px] text-muted">{label}</p>
                  <p className="mt-1 font-heading text-xl font-bold text-heading">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              <RiskBar label="Reading rate" value={84} level="elevated" />
              <RiskBar label="Word omissions" value={78} level="elevated" />
              <RiskBar label="Pause frequency" value={54} level="moderate" />
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">Screening concern for review. Not a clinical diagnosis.</p>
          </Card>
        </div>
      </section>

      <section className="border-y border-line bg-background">
        <div className="mx-auto grid max-w-[1200px] gap-4 px-5 py-6 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
          {[
            [Sparkles, "Explainable Results"],
            [BookOpen, "School-Friendly Inputs"],
            [LockKeyhole, "Privacy-Aware"],
            [ShieldCheck, "Research-Driven"],
          ].map(([Icon, label]) => (
            <div key={label as string} className="flex items-center gap-3 text-sm font-medium text-heading">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-primary-dark">
                <Icon className="h-4 w-4" />
              </span>
              {label as string}
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <h2 className="text-3xl font-bold text-heading">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.n}>
              <p className="text-sm font-semibold text-primary-dark">{step.n}</p>
              <h3 className="mt-3 text-lg font-semibold text-heading">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="modules" className="bg-background">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
          <h2 className="text-3xl font-bold text-heading">Three screening modules</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {modules.map((item) => (
              <Card key={item.title} hover>
                <item.icon className="h-5 w-5 text-primary-dark" />
                <h3 className="mt-4 text-lg font-semibold text-heading">{item.title}</h3>
                <p className="mt-1 text-sm font-medium text-primary-dark">{item.kicker}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="explainability" className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-20 md:px-8 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold text-heading">Explainable screening, not a black box</h2>
          <p className="mt-4 text-sm leading-7 text-body">
            LearnGuard explains which observable signals influenced the screening result instead of providing a black-box prediction.
          </p>
        </div>
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-heading text-5xl font-bold text-heading">72%</p>
              <div className="mt-2">
                <RiskBadge level="elevated" phrase />
              </div>
            </div>
            <p className="text-sm text-muted">Why this result?</p>
          </div>
          <div className="mt-6 space-y-3">
            <RiskBar label="Reading Rate · High contribution" value={86} level="elevated" />
            <RiskBar label="Word Omissions · High contribution" value={78} level="elevated" />
            <RiskBar label="Pause Frequency · Moderate contribution" value={54} level="moderate" />
          </div>
        </Card>
      </section>

      <section id="research" className="bg-[#F7F7FA]">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
          <h2 className="max-w-xl text-3xl font-bold text-heading">Built around research, not just prediction.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Base-Paper Replication", "Multimodal Comparison", "Explainability Evaluation", "Leakage-Aware Validation"].map((item) => (
              <Card key={item}>
                <h3 className="text-base font-semibold text-heading">{item}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Part of the screening research behind each module.</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <h2 className="text-3xl font-bold text-heading">Privacy, kept practical</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Anonymized Student IDs", "Consent-Aware Workflow", "Controlled Data Access", "Screening, Not Diagnosis"].map((item) => (
            <div key={item} className="rounded-2xl border border-line px-5 py-5">
              <p className="text-sm font-semibold text-heading">{item}</p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
