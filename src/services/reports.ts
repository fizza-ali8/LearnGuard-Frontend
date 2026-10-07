import { endpoints } from "@/config/endpoints";
import { seedReports } from "@/data/seed";
import { api, delay, isMockApi } from "@/lib/api";
import { TEACHER } from "@/lib/constants";
import type { AssessmentType, Report, Student } from "@/types";

export async function getReports() {
  if (!isMockApi()) {
    const { data } = await api.get<Report[]>(endpoints.reports);
    return data;
  }
  await delay(140);
  return seedReports;
}

export async function generateReport(student: Student, included: AssessmentType[]) {
  if (!isMockApi()) {
    const { data } = await api.post<Report>(endpoints.report(student.id), { included });
    return data;
  }
  await delay(300);
  const report: Report = {
    id: `rep-${Date.now()}`,
    studentId: student.id,
    createdAt: new Date().toISOString(),
    included,
    generatedBy: TEACHER.name,
    status: "ready",
  };
  return report;
}

export async function getReportsByStudent(studentId: string) {
  const rows = await getReports();
  return rows.filter((item) => item.studentId === studentId);
}

export const reportService = {
  getAll: getReports,
  getByStudent: getReportsByStudent,
  generate: generateReport,
};
