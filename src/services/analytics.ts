import { endpoints } from "@/config/endpoints";
import { api, isDemoMode } from "@/lib/api";
import { GRADES } from "@/lib/constants";
import { isActionable, levelFromScore, moduleConcernLevel, moduleLabel, RISK_LEVELS, screeningStatus } from "@/lib/risk";
import type { Assessment, RiskLevel, Student } from "@/types";
import { format, parseISO } from "date-fns";

export interface AnalyticsSnapshot {
  students: number;
  screened: number;
  pending: number;
  elevated: number;
  referralSuggested: number;
  coverage: number;
  byLevel: { level: RiskLevel; label: string; count: number }[];
  byModule: { module: string; low: number; moderate: number; elevated: number; high: number }[];
  byGrade: { grade: string; low: number; moderate: number; elevated: number; high: number }[];
  overTime: { month: string; count: number }[];
  moduleConcerns: { module: string; count: number }[];
}

export function computeAnalytics(students: Student[], assessments: Assessment[]): AnalyticsSnapshot {
  const screened = students.filter((student) => screeningStatus(student) !== "not_started").length;
  const pending = students.filter((student) => screeningStatus(student) !== "complete").length;
  const elevated = students.filter((student) => isActionable(student.riskProfile.overallConcern)).length;
  const referralSuggested = students.filter((student) => student.riskProfile.overallConcern === "high").length;
  const byLevel = RISK_LEVELS.map((level) => ({
    level,
    label: level[0].toUpperCase() + level.slice(1),
    count: students.filter((student) => student.riskProfile.overallConcern === level).length,
  }));
  const modules = ["dyslexia", "dysgraphia", "adhd"] as const;
  const byModule = modules.map((module) => {
    const row = { module: moduleLabel[module], low: 0, moderate: 0, elevated: 0, high: 0 };
    students.forEach((student) => {
      const level = moduleConcernLevel(student.riskProfile[module]);
      if (level) row[level] += 1;
    });
    return row;
  });
  const grades = GRADES;
  const byGrade = grades.map((grade) => {
    const row = { grade: `Grade ${grade}`, low: 0, moderate: 0, elevated: 0, high: 0 };
    students
      .filter((student) => student.grade === grade && student.riskProfile.overallConcern)
      .forEach((student) => {
        const level = student.riskProfile.overallConcern;
        if (level) row[level] += 1;
      });
    return row;
  });
  const monthMap = new Map<string, number>();
  assessments.forEach((assessment) => {
    const key = format(parseISO(assessment.createdAt), "MMM yyyy");
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  });
  const overTime = Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count, sort: parseISO(`01 ${month}`).getTime() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ month, count }) => ({ month, count }));
  const moduleConcerns = modules.map((module) => ({
    module: moduleLabel[module],
    count: students.filter((student) => isActionable(moduleConcernLevel(student.riskProfile[module]))).length,
  }));
  return {
    students: students.length,
    screened,
    pending,
    elevated,
    referralSuggested,
    coverage: students.length ? Math.round((screened / students.length) * 100) : 0,
    byLevel,
    byModule,
    byGrade,
    overTime,
    moduleConcerns,
  };
}

export async function getOverview(input: { scope: string; students: Student[]; assessments: Assessment[] }) {
  const students = input.scope === "all" ? input.students : input.students.filter((student) => student.section === input.scope);
  const ids = new Set(students.map((student) => student.id));
  const assessments = input.assessments.filter((item) => ids.has(item.studentId));
  if (!isDemoMode()) {
    const { data } = await api.get<AnalyticsSnapshot>(endpoints.analytics, { params: { scope: input.scope } });
    if (typeof data?.students !== "number" || !Array.isArray(data.byLevel)) {
      throw new Error("Analytics response was not in the expected shape.");
    }
    return data;
  }
  return computeAnalytics(students, assessments);
}

export const analyticsService = { getOverview };

export { levelFromScore };
