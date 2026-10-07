"use client";

import { useData } from "@/providers/data-provider";

export function useStudent(id: string) {
  const data = useData();
  const student = data.students.find((item) => item.id === id);
  const assessments = data.assessments
    .filter((item) => item.studentId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const observations = data.observations
    .filter((item) => item.studentId === id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const reports = data.reports
    .filter((item) => item.studentId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ...data, student, assessments, observations, reports };
}
