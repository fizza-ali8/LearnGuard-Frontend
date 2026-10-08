"use client";

import { PageHeader, FilterChip } from "@/components/ui/display";
import { Select } from "@/components/ui/inputs";
import { GRADES } from "@/lib/constants";
import { riskLabel, riskTone, screeningStatus } from "@/lib/risk";
import { formatDate } from "@/lib/format";
import { usePreferences } from "@/providers/preferences-provider";
import { useData } from "@/providers/data-provider";
import type { AssessmentType, Student } from "@/types";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const modules: AssessmentType[] = ["dyslexia", "dysgraphia", "adhd"];

export function HeatmapView() {
  const { students, assessments, sections, classScope, setClassScope } = useData();
  const { preferences } = usePreferences();
  const router = useRouter();
  const [grade, setGrade] = useState("all");
  const [category, setCategory] = useState<"all" | AssessmentType>("all");
  const [risk, setRisk] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    return students.filter((student) => {
      const inClass = classScope === "all" || student.section === classScope;
      const inGrade = grade === "all" || student.grade === grade;
      const inStatus = status === "all" || screeningStatus(student) === status;
      const inRisk =
        risk === "all" ||
        modules.some((type) => (category === "all" || category === type) && student.riskProfile[type]?.level === risk);
      return inClass && inGrade && inStatus && inRisk;
    });
  }, [category, classScope, grade, risk, status, students]);

  return (
    <div>
      <PageHeader title="Class Risk Heatmap" subtitle={`Viewing: ${classScope === "all" ? "All classes" : `Class ${classScope}`}. Review screening indicators across students at a glance.`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Select aria-label="Class" value={classScope} onChange={(event) => setClassScope(event.target.value)} className="h-9 w-auto">
          <option value="all">All classes</option>
          {sections.map((section) => (
            <option key={section} value={section}>Class {section}</option>
          ))}
        </Select>
        <Select aria-label="Grade" value={grade} onChange={(event) => setGrade(event.target.value)} className="h-9 w-auto">
          <option value="all">All grades</option>
          {GRADES.map((item) => (
            <option key={item} value={item}>Grade {item}</option>
          ))}
        </Select>
        <Select aria-label="Screening category" value={category} onChange={(event) => setCategory(event.target.value as "all" | AssessmentType)} className="h-9 w-auto">
          <option value="all">All categories</option>
          <option value="dyslexia">Dyslexia</option>
          <option value="dysgraphia">Dysgraphia</option>
          <option value="adhd">ADHD-related</option>
        </Select>
        {(["all", "low", "moderate", "elevated", "high"] as const).map((level) => (
          <FilterChip key={level} active={risk === level} onClick={() => setRisk(level)}>
            {level === "all" ? "All risk levels" : riskLabel[level]}
          </FilterChip>
        ))}
        <Select aria-label="Assessment status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 w-auto">
          <option value="all">All statuses</option>
          <option value="complete">Fully screened</option>
          <option value="partial">Partially screened</option>
          <option value="not_started">Not started</option>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-soft text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Dyslexia</th>
              <th className="px-4 py-3 font-medium">Dysgraphia</th>
              <th className="px-4 py-3 font-medium">ADHD-related</th>
              <th className="px-4 py-3 font-medium">Latest Assessment</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">No students in this class. Choose another class or add a student.</td>
              </tr>
            ) : null}
            {rows.map((student) => {
              const latest = assessments
                .filter((item) => item.studentId === student.id)
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
              return (
                <tr key={student.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <button type="button" className="text-left" onClick={() => router.push(`/students/${student.id}`)}>
                      <span className="block text-sm font-medium text-heading">{student.name}</span>
                      <span className="text-xs text-faint">Grade {student.grade} · {student.section}</span>
                    </button>
                  </td>
                  {modules.map((type) => {
                    const latestOfType = assessments
                      .filter((item) => item.studentId === student.id && item.type === type)
                      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                    return (
                      <td key={type} className="px-2 py-2">
                        <HeatCell
                          student={student}
                          type={type}
                          href={latestOfType ? `/results/${latestOfType.id}` : `/students/${student.id}`}
                          dateFormat={preferences.dateFormat}
                          hidden={category !== "all" && category !== type}
                          onOpen={(href) => router.push(href)}
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-sm text-muted">{latest ? formatDate(latest.createdAt, preferences.dateFormat) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-5 text-faint">Cell colour repeats the written risk label. Select a cell to open the latest result for that module.</p>
    </div>
  );
}

function HeatCell({
  student,
  type,
  href,
  dateFormat,
  hidden,
  onOpen,
}: {
  student: Student;
  type: AssessmentType;
  href: string;
  dateFormat: string;
  hidden?: boolean;
  onOpen: (href: string) => void;
}) {
  const result = student.riskProfile[type];
  if (hidden) return <span className="text-xs text-faint">—</span>;
  if (!result) {
    return <span className="inline-flex rounded-xl bg-soft px-3 py-2 text-xs text-muted">Not assessed</span>;
  }
  if (type === "adhd" && result.researchScreen) {
    const elevated = result.researchScreen === "elevated_pattern";
    return (
      <button type="button" onClick={() => onOpen(href)} className={`w-full rounded-xl px-3 py-2 text-left ${elevated ? "bg-primary-soft" : "bg-soft"}`}>
        <span className="block text-xs font-semibold text-heading">{elevated ? "Elevated pattern" : "No elevated pattern"}</span>
        <span className="text-[11px] text-muted">Caregiver questionnaire</span>
      </button>
    );
  }
  const tone = riskTone(result.level);
  return (
    <button
      type="button"
      onClick={() => onOpen(href)}
      className={`group relative w-full rounded-xl px-3 py-2 text-left ${tone.bg}`}
    >
      <span className={`block text-xs font-semibold ${tone.text}`}>{riskLabel[result.level]}</span>
      <span className="text-[11px] text-heading">{result.score}%</span>
      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-20 hidden w-48 rounded-xl border border-line bg-surface p-3 text-left shadow-card group-hover:block group-focus:block">
        <span className="block text-xs font-semibold text-heading">{type === "adhd" ? "ADHD-related" : type[0].toUpperCase() + type.slice(1)} risk</span>
        <span className="block text-sm text-heading">{result.score}%</span>
        <span className="block text-[11px] text-muted">Last assessed: {result.assessedAt ? formatDate(result.assessedAt, dateFormat) : "—"}</span>
      </span>
    </button>
  );
}
