"use client";

import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/display";
import { ProgressRing, RiskBadge } from "@/components/ui/risk";
import { formatActivityWhen } from "@/lib/format";
import { isActionable, moduleLabel } from "@/lib/risk";
import { getOverview, type AnalyticsSnapshot } from "@/services/analytics";
import { useData } from "@/providers/data-provider";
import { ClipboardPlus, UserPlus, Users } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

const RiskDistributionChart = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((mod) => mod.RiskDistributionChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-soft" /> },
);
const ModuleRiskChart = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((mod) => mod.ModuleRiskChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-soft" /> },
);

export function DashboardView() {
  const { ready, students, scopedStudents, assessments, activities, classScope } = useData();
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [analyticsError, setAnalyticsError] = useState(false);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    getOverview({ scope: classScope, students, assessments })
      .then((value) => {
        if (!active) return;
        setAnalyticsError(false);
        setAnalytics(value);
      })
      .catch(() => {
        if (active) setAnalyticsError(true);
      });
    return () => {
      active = false;
    };
  }, [assessments, classScope, ready, students]);
  if (!ready) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          subtitle="Overview of student screening activity and recent risk indicators."
          actions={
            <Link href="/students/new">
              <Button>
                <UserPlus className="h-4 w-4" /> Add Student
              </Button>
            </Link>
          }
        />
        <EmptyState icon={<Users className="h-5 w-5" />} title="No students yet." description="Add a student to start screening. Counts, charts and activity will appear here." action={<Link href="/students/new"><Button>Add Student</Button></Link>} />
      </div>
    );
  }

  if (scopedStudents.length === 0) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle={`Viewing: Class ${classScope}`} />
        <EmptyState icon={<Users className="h-5 w-5" />} title="No students in this class." description="Choose another class from the top bar, or add a student to this class." />
      </div>
    );
  }

  if (analyticsError || !analytics) {
    return analyticsError ? (
      <ErrorState title="Analytics could not be loaded." description="The screening summary is unavailable right now. Refresh the page to try again." />
    ) : (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    );
  }
  const addedThisTerm = scopedStudents.filter((student) => student.createdAt >= "2026-08-01").length;
  const review = scopedStudents
    .filter((student) => isActionable(student.riskProfile.overallConcern))
    .sort((a, b) => (b.riskProfile.dyslexia?.score ?? 0) - (a.riskProfile.dyslexia?.score ?? 0))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Viewing: ${classScope === "all" ? "All classes" : `Class ${classScope}`}. Overview of student screening activity and recent risk indicators.`}
        actions={
          <>
            <Link href="/students/new">
              <Button>
                <UserPlus className="h-4 w-4" /> Add Student
              </Button>
            </Link>
            <Link href="/assessment/new">
              <Button variant="secondary">Start Assessment</Button>
            </Link>
            <Link href="/behaviour">
              <Button variant="secondary">Log Behaviour</Button>
            </Link>
            <Link href="/heatmap">
              <Button variant="tertiary">View Heatmap</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat href="/students" icon={<Users className="h-4 w-4" />} label="Total Students" value={analytics.students} helper={`${addedThisTerm} added this term`} />
        <Stat href="/history" icon={<ClipboardPlus className="h-4 w-4" />} label="Students Screened" value={analytics.screened} helper={`${analytics.coverage}% screening coverage`} />
        <Stat href="/heatmap" icon={<span className="h-2 w-2 rounded-full bg-risk-elevated" />} label="Elevated Risk" value={analytics.elevated} helper="Requires review" />
        <Stat href="/students" icon={<span className="h-2 w-2 rounded-full bg-risk-moderate" />} label="Pending Assessments" value={analytics.pending} helper="Not yet fully screened" />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {analytics.moduleConcerns.map((item) => (
          <div key={item.module} className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-xs text-muted">{item.module}</p>
            <p className="mt-1 text-sm font-semibold text-heading">{item.count} elevated or high</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="text-base font-semibold text-heading">Risk Distribution</h2>
          <p className="mb-4 text-xs text-muted">Students by overall screening concern</p>
          <div className="h-64">
            <RiskDistributionChart data={analytics.byLevel} />
          </div>
        </Card>
        <Card className="flex items-center justify-center">
          <div>
            <h2 className="mb-4 text-center text-base font-semibold text-heading">Screening Completion</h2>
            <ProgressRing value={analytics.coverage} label="Coverage" sublabel={`${analytics.screened} of ${analytics.students} students`} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <h2 className="text-base font-semibold text-heading">Risk by Screening Category</h2>
          <div className="mt-4 h-64">
            <ModuleRiskChart data={analytics.byModule} />
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <h2 className="text-base font-semibold text-heading">Recent Activity</h2>
          <ul className="mt-4 space-y-2">
            {activities.length === 0 ? <li className="text-sm text-muted">No screening activity yet.</li> : null}
            {activities.slice(0, 4).map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="flex items-start justify-between gap-3 rounded-xl px-2 py-2 hover:bg-primary-softer">
                  <div>
                    <p className="text-sm font-medium text-heading">{item.studentName}</p>
                    <p className="text-xs leading-5 text-muted">{item.title}</p>
                  </div>
                  <div className="text-right">
                    {item.riskLevel ? <RiskBadge level={item.riskLevel} /> : null}
                    <p className="mt-1 text-[11px] text-faint">{formatActivityWhen(item.createdAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-heading">Students Requiring Review</h2>
          <Link href="/students" className="text-sm font-medium text-primary-dark">
            View all
          </Link>
        </div>
        <div className="divide-y divide-line">
          {review.map((student) => {
            const main = (["dyslexia", "dysgraphia", "adhd"] as const)
              .map((type) => ({ type, result: student.riskProfile[type] }))
              .filter((item) => item.result && isActionable(item.result.level))
              .sort((a, b) => (b.result?.score ?? 0) - (a.result?.score ?? 0))[0];
            return (
              <div key={student.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-dark">
                  {student.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-heading">{student.name}</p>
                  <p className="text-xs text-muted">Grade {student.grade} · {main ? moduleLabel[main.type] : "Screening"}</p>
                </div>
                {student.riskProfile.overallConcern ? <RiskBadge level={student.riskProfile.overallConcern} /> : null}
                <Link href={`/students/${student.id}`}>
                  <Button variant="secondary" size="sm">Review Student</Button>
                </Link>
              </div>
            );
          })}
        </div>
      </Card>
      <p className="mt-4 text-xs text-faint">Elevated and high counts are screening indicators. LearnGuard does not diagnose learning disorders.</p>
    </div>
  );
}

function Stat({ icon, label, value, helper, href }: { icon: React.ReactNode; label: string; value: number; helper: string; href: string }) {
  return (
    <Link href={href} className="block rounded-2xl focus-visible:outline-none">
    <Card className="h-full transition-shadow duration-200 hover:shadow-card">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">{icon}</div>
      <p className="font-heading text-3xl font-bold text-heading">{value}</p>
      <p className="mt-1 text-sm font-medium text-heading">{label}</p>
      <p className="text-xs text-muted">{helper}</p>
    </Card>
    </Link>
  );
}

