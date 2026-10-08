"use client";

import { ScreeningDisclaimer } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Breadcrumb, Card, EmptyState, ErrorState, LinkTabs, PageHeader, Skeleton, StudentAvatar } from "@/components/ui/display";
import { ConfirmDialog, DropdownMenu } from "@/components/ui/overlay";
import { RiskBadge, RiskBar } from "@/components/ui/risk";
import { DYSLEXIA_DISCLAIMER, qualityCheckText } from "@/lib/dyslexia-audio";
import { formatDate } from "@/lib/format";
import { moduleFullLabel, moduleLabel, OVERALL_CONCERN_NOTE } from "@/lib/risk";
import { copyText } from "@/lib/utils";
import { adhdDraftKey, adhdScreenStatus, answeredCount, isAdhdEligible, type AdhdAnswers } from "@/data/adhd-questionnaire";
import { usePreferences } from "@/providers/preferences-provider";
import { useStudent } from "@/hooks/use-student";
import type { AssessmentType } from "@/types";
import { Copy, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const TimelineChart = dynamic(
  () => import("@/components/students/timeline-chart").then((mod) => mod.TimelineChart),
  { ssr: false, loading: () => <div className="mt-6 h-72 animate-pulse rounded-xl bg-soft" /> },
);
import { format, parseISO } from "date-fns";

export type ProfileSection = "overview" | "assessments" | "timeline" | "explanations" | "behaviour" | "reports";

export function StudentProfile({ studentId, section }: { studentId: string; section: ProfileSection }) {
  const { ready, student, assessments, observations, reports, deleteStudent, createReport } = useStudent(studentId);
  const { preferences } = usePreferences();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [timeline, setTimeline] = useState<AssessmentType>("dyslexia");

  const tabs = [
    { href: `/students/${studentId}`, label: "Overview", active: section === "overview" },
    { href: `/students/${studentId}/assessments`, label: "Assessments", active: section === "assessments" },
    { href: `/students/${studentId}/timeline`, label: "Timeline", active: section === "timeline" },
    { href: `/students/${studentId}/explanations`, label: "Explanations", active: section === "explanations" },
    { href: `/students/${studentId}/behaviour`, label: "Observations", active: section === "behaviour" },
    { href: `/students/${studentId}/reports`, label: "Reports", active: section === "reports" },
  ];

  useEffect(() => {
    const saved = localStorage.getItem(adhdDraftKey(studentId));
    if (!saved) {
      setDraftCount(null);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as { answers?: AdhdAnswers };
      const count = answeredCount(parsed.answers ?? {});
      setDraftCount(count > 0 ? count : null);
    } catch {
      setDraftCount(null);
    }
  }, [studentId]);

  const chartData = useMemo(() => {
    return assessments
      .filter((item): item is typeof item & { score: number } => item.type === timeline && timeline !== "adhd" && !item.dyslexiaAudio && typeof item.score === "number")
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
  const audioReview = assessments.find((item) => item.type === "dyslexia" && item.dyslexiaAudio);

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
                { label: "Dyslexia audio analysis", href: `/assessment/dyslexia/${student.id}` },
                { label: "Dysgraphia screening", href: `/assessment/dysgraphia/${student.id}` },
                { label: "ADHD caregiver screening", href: `/assessment/adhd/${student.id}` },
                { label: "Log classroom observation", href: `/behaviour/log/${student.id}` },
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

      {draftCount ? (
        <Card className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-heading">ADHD Caregiver Questionnaire</p>
            <p className="text-xs text-muted">Draft · {draftCount} / 20 answered</p>
          </div>
          <Link href={`/assessment/adhd/${student.id}`}><Button size="sm">Resume</Button></Link>
        </Card>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {modules.map((type) => {
          const result = student.riskProfile[type];
          const adhdBlocked = type === "adhd" && !isAdhdEligible(student.age);
          return (
            <Card key={type}>
              <p className="text-sm font-semibold text-heading">{type === "adhd" ? "ADHD-Related Screening" : moduleLabel[type]}</p>
              {adhdBlocked && !result ? (
                <p className="mt-4 text-sm text-muted">Not available. This screening model is currently validated for children aged 6–11.</p>
              ) : result?.researchScreen ? (
                <>
                  <p className="mt-3 text-sm font-semibold leading-6 text-heading">{result.researchScreen === "elevated_pattern" ? adhdScreenStatus(true) : adhdScreenStatus(false)}</p>
                  {result.researchMessage ? <p className="mt-2 text-sm leading-6 text-muted">{result.researchMessage}</p> : null}
                  <p className="mt-3 text-xs text-muted">Completed: {result.assessedAt ? formatDate(result.assessedAt, preferences.dateFormat) : "—"}</p>
                  <p className="mt-1 text-xs text-muted">Source: Caregiver questionnaire</p>
                  <p className="mt-2 text-xs leading-5 text-faint">Research prototype. Not a diagnosis or a replacement for professional assessment.</p>
                  <Link href={`/students/${student.id}/assessments`} className="mt-3 inline-flex text-sm font-medium text-primary-dark">View details</Link>
                </>
              ) : type === "dyslexia" && audioReview?.dyslexiaAudio ? (
                <>
                  <p className="mt-4 text-sm font-semibold text-heading">Not assessed</p>
                  <p className="mt-2 text-sm text-muted">Duration: {audioReview.dyslexiaAudio.durationSeconds.toFixed(2)} seconds</p>
                  <p className="mt-1 text-sm leading-6 text-muted">estimated audio activity (not reading speed, not verified speech): {audioReview.dyslexiaAudio.estimatedActivitySeconds.toFixed(2)} seconds</p>
                  <p className="mt-1 text-sm text-muted">Quality check: {qualityCheckText(audioReview.dyslexiaAudio.qualityFlags)}</p>
                  <p className="mt-2 text-xs leading-5 text-faint">{DYSLEXIA_DISCLAIMER}</p>
                  <Link href={`/results/${audioReview.id}`} className="mt-3 inline-flex text-sm font-medium text-primary-dark">View details</Link>
                </>
              ) : result ? (
                <>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="font-heading text-3xl font-bold text-heading">{result.score}%</p>
                    <RiskBadge level={result.level} />
                  </div>
                  <div className="mt-3">
                    <RiskBar value={result.score} level={result.level} />
                  </div>
                  <p className="mt-3 text-xs text-muted">{type === "adhd" ? "Completed" : "Last screened"}: {result.assessedAt ? formatDate(result.assessedAt, preferences.dateFormat) : "—"}</p>
                  {type === "adhd" ? <p className="mt-1 text-xs text-muted">Source: Caregiver questionnaire</p> : null}
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
                  if (result?.researchScreen) {
                    return <p key={type} className="text-sm text-body"><span className="font-medium text-heading">{moduleLabel[type]}. </span>{result.researchScreen === "elevated_pattern" ? adhdScreenStatus(true) : adhdScreenStatus(false)}</p>;
                  }
                  if (type === "dyslexia" && !result && audioReview) {
                    return <p key={type} className="text-sm text-body"><span className="font-medium text-heading">Dyslexia. </span>Not assessed. No risk score is available.</p>;
                  }
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
                  <p className="text-xs text-muted">{formatDate(latest.createdAt, preferences.dateFormat)} · {latest.dyslexiaAudio ? "Not assessed" : latest.adhdResult ? adhdScreenStatus(latest.adhdResult.screenPositive) : `${latest.score}%`}</p>
                  {latest.dyslexiaAudio ? <p className="mt-3 text-sm leading-6 text-body">{DYSLEXIA_DISCLAIMER}</p> : <p className="mt-3 text-sm leading-6 text-body">{latest.factors[0]?.label}: {latest.factors[0]?.detail}</p>}
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
                    {item.dyslexiaAudio ? <span className="text-sm font-semibold text-heading">Not assessed</span> : item.adhdResult ? <span className="text-sm font-semibold text-heading">{adhdScreenStatus(item.adhdResult.screenPositive)}</span> : <><span className="font-heading text-2xl font-bold text-heading">{item.score}%</span><RiskBadge level={item.riskLevel} /></>}
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
            {timeline === "adhd" ? (
              assessments.some((item) => item.type === "adhd") ? (
                <ul className="mt-4 space-y-2 text-sm text-body">
                  {assessments.filter((item) => item.type === "adhd").sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((item) => (
                    <li key={item.id}>{formatDate(item.createdAt, preferences.dateFormat)} · {item.adhdResult ? adhdScreenStatus(item.adhdResult.screenPositive) : adhdScreenStatus(item.riskLevel === "elevated" || item.riskLevel === "high")}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-8 text-sm text-muted">No {moduleLabel.adhd.toLowerCase()} assessments recorded yet.</p>
              )
            ) : chartData.length ? (
              <TimelineChart data={chartData} />
            ) : timeline === "dyslexia" && assessments.some((item) => item.dyslexiaAudio) ? (
              <ul className="mt-4 space-y-2 text-sm text-body">
                {assessments.filter((item) => item.dyslexiaAudio).map((item) => (
                  <li key={item.id}>{formatDate(item.createdAt, preferences.dateFormat)} · Not assessed. No risk score is available.</li>
                ))}
              </ul>
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
                  {item.dyslexiaAudio ? <span className="text-sm font-medium text-heading">Not assessed</span> : item.adhdResult ? <span className="text-sm font-medium text-heading">{adhdScreenStatus(item.adhdResult.screenPositive)}</span> : <RiskBadge level={item.riskLevel} />}
                </div>
                <p className="mt-2 text-xs text-muted">{formatDate(item.createdAt, preferences.dateFormat)}</p>
                <p className="mt-3 text-sm leading-6 text-body">{item.dyslexiaAudio ? DYSLEXIA_DISCLAIMER : item.adhdResult?.message ?? item.explanation}</p>
                {item.adhdResult ? <p className="mt-2 text-xs leading-5 text-faint">{item.adhdResult.disclaimer}</p> : null}
                {item.dyslexiaAudio ? null : <ul className="mt-3 space-y-1 text-sm text-muted">
                  {(item.adhdResult ? item.adhdResult.topFactors.slice(0, 3).map((factor) => ({ key: factor.feature, text: `${factor.question}: ${factor.answer}` })) : item.factors.slice(0, 3).map((factor) => ({ key: factor.label, text: `${factor.label} · ${factor.impact} contribution` }))).map((factor) => (
                    <li key={factor.key}>{factor.text}</li>
                  ))}
                </ul>}
                {item.dyslexiaAudio ? null : (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer font-medium text-primary-dark">Technical view</summary>
                    <p className="mt-2 text-muted">{item.modelName} {item.modelVersion} · {item.explanationMethod} · Dataset {item.datasetVersion}</p>
                  </details>
                )}
              </Card>
            )) : <EmptyState icon={<FileText className="h-5 w-5" />} title="No explanations yet." description="Explanations appear after a screening is analysed." />}
          </div>
        ) : null}

        {section === "behaviour" ? (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Link href={`/behaviour/log/${student.id}`}><Button>Add observation</Button></Link>
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
            )) : <EmptyState icon={<FileText className="h-5 w-5" />} title="No teacher observations." description="Record a classroom observation for longitudinal support. This does not start the ADHD screening." action={<Link href={`/behaviour/log/${student.id}`}><Button>Add observation</Button></Link>} />}
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
