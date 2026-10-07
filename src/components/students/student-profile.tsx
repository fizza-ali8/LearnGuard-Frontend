"use client";

import { ScreeningDisclaimer } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Breadcrumb, Card, EmptyState, ErrorState, LinkTabs, PageHeader, Skeleton, StudentAvatar } from "@/components/ui/display";
import { ConfirmDialog, DropdownMenu } from "@/components/ui/overlay";
import { RiskBadge, RiskBar } from "@/components/ui/risk";
import { formatDate } from "@/lib/format";
import { moduleFullLabel, moduleLabel, OVERALL_CONCERN_NOTE } from "@/lib/risk";
import { copyText } from "@/lib/utils";
import { usePreferences } from "@/providers/preferences-provider";
import { useStudent } from "@/hooks/use-student";
import type { AssessmentType } from "@/types";
import { Copy, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export type ProfileSection = "overview" | "assessments" | "timeline" | "explanations" | "behaviour" | "reports";

export function StudentProfile({ studentId, section }: { studentId: string; section: ProfileSection }) {
  const { ready, student, assessments, observations, reports, deleteStudent, createReport } = useStudent(studentId);
  const { preferences } = usePreferences();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [timeline, setTimeline] = useState<AssessmentType>("dyslexia");

  const tabs = [
    { href: `/students/${studentId}`, label: "Overview", active: section === "overview" },
    { href: `/students/${studentId}/assessments`, label: "Assessments", active: section === "assessments" },
    { href: `/students/${studentId}/timeline`, label: "Timeline", active: section === "timeline" },
    { href: `/students/${studentId}/explanations`, label: "Explanations", active: section === "explanations" },
    { href: `/students/${studentId}/behaviour`, label: "Behaviour", active: section === "behaviour" },
    { href: `/students/${studentId}/reports`, label: "Reports", active: section === "reports" },
  ];

  const chartData = useMemo(() => {
    return assessments
      .filter((item) => item.type === timeline)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((item) => ({ label: format(parseISO(item.createdAt), "MMM"), score: item.score }));
  }, [assessments, timeline]);

  if (!ready) return <Skeleton className="h-80" />;
  if (!student) {
    return (
      <ErrorState
        title="This student record is unavailable."
        description="It may have been removed from this browser’s demonstration data."
        action={<Link href="/students"><Button>Back to Students</Button></Link>}
      />
    );
  }

  const modules: AssessmentType[] = ["dyslexia", "dysgraphia", "adhd"];
  const latest = assessments[0];

  return (
    <div>
      <PageHeader
        title={student.name}
        subtitle="Student screening profile"
        breadcrumb={<Breadcrumb items={[{ label: "Students", href: "/students" }, { label: student.name }]} />}
        actions={
          <>
            <Link href={`/assessment/new?student=${student.id}`}>
              <Button>Start Assessment</Button>
            </Link>
            <Button
              variant="secondary"
              onClick={async () => {
                await createReport(student.id);
                toast.success("Report generated");
                router.push(`/reports/${student.id}`);
              }}
            >
              <FileText className="h-4 w-4" /> Generate Report
            </Button>
            <DropdownMenu
              trigger={<Button variant="secondary">More</Button>}
              items={[
                { label: "Dyslexia screening", href: `/assessment/dyslexia/${student.id}` },
                { label: "Dysgraphia screening", href: `/assessment/dysgraphia/${student.id}` },
                { label: "Log behaviour", href: `/assessment/adhd/${student.id}` },
                { label: "Delete student", destructive: true, onClick: () => setConfirmDelete(true) },
              ]}
            />
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <StudentAvatar name={student.name} className="h-16 w-16 text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-heading">{student.name}</h2>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-heading"
                onClick={async () => {
                  await copyText(student.code);
                  toast.success("Student ID copied");
                }}
              >
                {student.code} <Copy className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-soft px-2.5 py-1 text-body">Grade {student.grade}</span>
              <span className="rounded-full bg-soft px-2.5 py-1 text-body">Age {student.age}</span>
              <span className="rounded-full bg-soft px-2.5 py-1 text-body">{student.school}</span>
              <span className="rounded-full bg-soft px-2.5 py-1 text-body">Class {student.section}</span>
              <span className={`rounded-full px-2.5 py-1 ${student.consentVerified ? "bg-risk-low-bg text-risk-low" : "bg-risk-moderate-bg text-risk-moderate"}`}>
                {student.consentVerified ? "Consent verified" : "Consent pending"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Last screening: {latest ? formatDate(latest.createdAt, preferences.dateFormat) : "Not assessed yet"}
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {modules.map((type) => {
          const result = student.riskProfile[type];
          return (
            <Card key={type}>
              <p className="text-sm font-semibold text-heading">{moduleLabel[type]}</p>
              {result ? (
                <>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="font-heading text-3xl font-bold text-heading">{result.score}%</p>
                    <RiskBadge level={result.level} />
                  </div>
                  <div className="mt-3">
                    <RiskBar value={result.score} level={result.level} />
                  </div>
                  <p className="mt-3 text-xs text-muted">Last screened: {result.assessedAt ? formatDate(result.assessedAt, preferences.dateFormat) : "—"}</p>
                  <Link href={`/students/${student.id}/assessments`} className="mt-3 inline-flex text-sm font-medium text-primary-dark">
                    View details
                  </Link>
                </>
              ) : (
                <p className="mt-4 text-sm text-muted">Not assessed yet.</p>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <LinkTabs tabs={tabs} />
      </div>

      <div className="mt-6">
        {section === "overview" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="text-base font-semibold text-heading">Current Screening Profile</h3>
              <div className="mt-4 space-y-4">
                {modules.map((type) => {
                  const result = student.riskProfile[type];
                  return <RiskBar key={type} label={moduleLabel[type]} value={result?.score ?? 0} level={result?.level} />;
                })}
              </div>
              <div className="mt-5 rounded-xl bg-soft p-4">
                <p className="text-xs font-medium text-muted">Overall Screening Concern</p>
                <div className="mt-2">{student.riskProfile.overallConcern ? <RiskBadge level={student.riskProfile.overallConcern} phrase /> : <span className="text-sm text-muted">Not available</span>}</div>
                <p className="mt-2 text-sm leading-6 text-body">{student.riskProfile.overallNote}</p>
                <p className="mt-2 text-xs leading-5 text-faint">{OVERALL_CONCERN_NOTE}</p>
              </div>
            </Card>
            <Card>
              <h3 className="text-base font-semibold text-heading">Recent Assessment</h3>
              {latest ? (
                <div className="mt-4">
                  <p className="text-sm font-medium text-heading">{moduleFullLabel[latest.type]}</p>
                  <p className="text-xs text-muted">{formatDate(latest.createdAt, preferences.dateFormat)} · {latest.score}%</p>
                  <p className="mt-3 text-sm leading-6 text-body">{latest.factors[0]?.label}: {latest.factors[0]?.detail}</p>
                  <Link href={`/results/${latest.id}`} className="mt-4 inline-flex">
                    <Button variant="secondary" size="sm">Open result</Button>
                  </Link>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">No assessment has been recorded.</p>
              )}
              <h3 className="mt-6 text-base font-semibold text-heading">Current Indicators</h3>
              {latest && latest.factors.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {latest.factors.slice(0, 3).map((factor) => (
                    <Indicator key={factor.label} label={factor.label} level={factor.impact === "high" ? "elevated" : factor.impact} />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">No screening indicators available yet.</p>
              )}
            </Card>
            <Card className="lg:col-span-2">
              <h3 className="text-base font-semibold text-heading">Latest Recommendation</h3>
              <p className="mt-3 text-sm leading-6 text-body">
                {latest?.recommendation ?? "Complete a screening module before a recommendation can be shown."}
              </p>
              {student.notes ? <p className="mt-3 text-sm leading-6 text-muted">{student.notes}</p> : null}
              <ScreeningDisclaimer className="mt-4" />
            </Card>
          </div>
        ) : null}

        {section === "assessments" ? (
          assessments.length ? (
            <div className="space-y-3">
              {assessments.map((item) => (
                <Card key={item.id} className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-sm font-semibold text-heading">{moduleFullLabel[item.type]}</p>
                    <p className="text-xs text-muted">{formatDate(item.createdAt, preferences.dateFormat)} · {item.teacher}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-2xl font-bold text-heading">{item.score}%</span>
                    <RiskBadge level={item.riskLevel} />
                    <Link href={`/results/${item.id}`}><Button variant="secondary" size="sm">View Result</Button></Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={<FileText className="h-5 w-5" />} title="No assessments yet." description="Start a screening to build this student’s history." action={<Link href={`/assessment/new?student=${student.id}`}><Button>Start Assessment</Button></Link>} />
          )
        ) : null}

        {section === "timeline" ? (
          <Card>
            <h3 className="text-base font-semibold text-heading">Screening Risk Over Time</h3>
            <p className="mt-1 text-sm text-muted">Screening risk across recorded assessments.</p>
            <div className="mt-4 flex gap-2">
              {modules.map((type) => (
                <button key={type} type="button" onClick={() => setTimeline(type)} className={`h-9 rounded-full px-3 text-sm ${timeline === type ? "bg-primary-soft text-primary-dark" : "bg-soft text-body"}`}>
                  {moduleLabel[type]}
                </button>
              ))}
            </div>
            {chartData.length ? (
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#E8E8F0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#5F50C8" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-8 text-sm text-muted">No {moduleLabel[timeline].toLowerCase()} assessments recorded yet.</p>
            )}
          </Card>
        ) : null}

        {section === "explanations" ? (
          <div className="space-y-3">
            {assessments.length ? assessments.slice(0, 8).map((item) => (
              <Card key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-heading">{moduleFullLabel[item.type]}</p>
                  <RiskBadge level={item.riskLevel} />
                </div>
                <p className="mt-2 text-xs text-muted">{formatDate(item.createdAt, preferences.dateFormat)}</p>
                <p className="mt-3 text-sm leading-6 text-body">{item.explanation}</p>
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  {item.factors.slice(0, 3).map((factor) => (
                    <li key={factor.label}>{factor.label} · {factor.impact} contribution</li>
                  ))}
                </ul>
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-medium text-primary-dark">Technical view</summary>
                  <p className="mt-2 text-muted">{item.modelName} {item.modelVersion} · {item.explanationMethod} · Dataset {item.datasetVersion}</p>
                </details>
              </Card>
            )) : <EmptyState icon={<FileText className="h-5 w-5" />} title="No explanations yet." description="Explanations appear after a screening is analysed." />}
          </div>
        ) : null}

        {section === "behaviour" ? (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Link href={`/assessment/adhd/${student.id}`}><Button>Log observation</Button></Link>
            </div>
            {observations.length ? observations.map((item) => (
              <Card key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-heading">{format(parseISO(item.date), "dd MMM yyyy")} · {item.subject}</p>
                    <p className="text-xs text-muted">{item.durationMin} min · Attention {item.sustainedAttentionMin} min · Off-task {item.offTaskEvents}</p>
                  </div>
                  <RiskBadge level={item.riskLevel} />
                </div>
                {item.notes ? <p className="mt-3 text-sm leading-6 text-body">{item.notes}</p> : null}
              </Card>
            )) : <EmptyState icon={<FileText className="h-5 w-5" />} title="No behaviour observations." description="Record a classroom observation to start this timeline." action={<Link href={`/assessment/adhd/${student.id}`}><Button>Log observation</Button></Link>} />}
          </div>
        ) : null}

        {section === "reports" ? (
          reports.length ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <Card key={report.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-heading">Screening report</p>
                    <p className="text-xs text-muted">{formatDate(report.createdAt, preferences.dateFormat)} · {report.generatedBy}</p>
                  </div>
                  <Link href={`/reports/${student.id}`}><Button variant="secondary" size="sm">Preview</Button></Link>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={<FileText className="h-5 w-5" />} title="No reports yet." description="Generate a screening summary from the current profile." action={<Button onClick={async () => { await createReport(student.id); toast.success("Report generated"); router.push(`/reports/${student.id}`); }}>Generate Report</Button>} />
          )
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Student?"
        description="This will permanently remove the student’s stored screening records from this browser."
        confirmLabel="Delete Student"
        destructive
        onConfirm={() => {
          deleteStudent(student.id);
          toast.success("Student record removed");
          router.push("/students");
        }}
      />
    </div>
  );
}

function Indicator({ label, level }: { label: string; level?: "low" | "moderate" | "elevated" | "high" }) {
  const text = !level ? "Not assessed" : level === "high" || level === "elevated" ? "High concern" : level === "moderate" ? "Moderate concern" : "Low concern";
  return (
    <li className="flex items-center justify-between">
      <span className="text-body">{label}</span>
      <span className="text-heading">{text}</span>
    </li>
  );
}
