"use client";

import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/display";
import { ProgressRing } from "@/components/ui/risk";
import { getOverview, type AnalyticsSnapshot } from "@/services/analytics";
import { useData } from "@/providers/data-provider";
import { BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #E8E8F0",
  fontSize: 13,
};

export function AnalyticsView() {
  const { ready, students, scopedStudents, assessments, classScope } = useData();
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [analyticsError, setAnalyticsError] = useState(false);
  const viewing = classScope === "all" ? "All classes" : `Class ${classScope}`;
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
  if (!ready || (!analytics && !analyticsError)) return <Skeleton className="h-80" />;
  if (analyticsError || !analytics) {
    return <ErrorState title="Analytics could not be loaded." description="Class figures are unavailable right now. Refresh the page to try again." />;
  }
  if (students.length === 0 || scopedStudents.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle={`Viewing: ${viewing}`} />
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" />}
          title={students.length === 0 ? "No analytics data yet." : "No students in this class."}
          description={students.length === 0 ? "Add students and complete screenings to see class patterns." : "Choose another class from the top bar."}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Analytics" subtitle={`Viewing: ${viewing}. Explore class-level screening patterns and assessment activity.`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Students Screened" value={analytics.screened} hint={`${analytics.coverage}% of this view`} />
        <Metric label="Pending" value={analytics.pending} hint="Not fully screened" />
        <Metric label="Elevated" value={analytics.elevated} hint="Elevated or high concern" />
        <Metric label="Referral Suggested" value={analytics.referralSuggested} hint="High screening concern" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Risk Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.byLevel}>
              <CartesianGrid stroke="#E8E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#8B7CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Risk by Grade">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.byGrade}>
              <CartesianGrid stroke="#E8E8F0" vertical={false} />
              <XAxis dataKey="grade" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="low" stackId="g" fill="#86EFAC" />
              <Bar dataKey="moderate" stackId="g" fill="#FCD34D" />
              <Bar dataKey="elevated" stackId="g" fill="#FDBA74" />
              <Bar dataKey="high" stackId="g" fill="#FCA5A5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Screening Category Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.byModule}>
              <CartesianGrid stroke="#E8E8F0" vertical={false} />
              <XAxis dataKey="module" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="low" stackId="m" fill="#86EFAC" />
              <Bar dataKey="moderate" stackId="m" fill="#FCD34D" />
              <Bar dataKey="elevated" stackId="m" fill="#FDBA74" />
              <Bar dataKey="high" stackId="m" fill="#FCA5A5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Assessments Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.overTime}>
              <CartesianGrid stroke="#E8E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#5F50C8" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <Card className="mt-4 flex justify-center">
        <ProgressRing value={analytics.coverage} label="Screening Completion" sublabel={`${analytics.screened} of ${analytics.students} students have at least one result`} />
      </Card>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-heading text-3xl font-bold text-heading">{value}</p>
      <p className="mt-1 text-xs text-faint">{hint}</p>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="mb-3 text-base font-semibold text-heading">{title}</h2>
      <div className="h-64">{children}</div>
    </Card>
  );
}
