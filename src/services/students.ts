import { endpoints } from "@/config/endpoints";
import { emptyRiskProfile, seedStudents } from "@/data/seed";
import { api, delay, isDemoMode, isMockApi } from "@/lib/api";
import { SCHOOL } from "@/lib/constants";
import type { CreateStudentInput, Student } from "@/types";

export async function getStudents() {
  if (!isMockApi()) {
    const { data } = await api.get<Student[]>(endpoints.students);
    return data;
  }
  await delay(180);
  return seedStudents;
}

export async function getStudent(id: string) {
  if (!isMockApi()) {
    const { data } = await api.get<Student>(endpoints.student(id));
    return data;
  }
  await delay(120);
  return seedStudents.find((student) => student.id === id) ?? null;
}

export async function createStudent(input: CreateStudentInput, existing: Student[]) {
  if (!isMockApi()) {
    const { data } = await api.post<Student>(endpoints.students, input);
    return data;
  }
  await delay(280);
  const duplicate = existing.some((student) => student.code.toLowerCase() === input.code.toLowerCase());
  if (duplicate) {
    throw new Error("A student with this ID already exists.");
  }
  const now = new Date().toISOString();
  const student: Student = {
    id: `stu-${Date.now()}`,
    code: input.code.toUpperCase(),
    name: input.name,
    age: input.age,
    grade: input.grade,
    school: input.school || SCHOOL,
    section: input.section,
    consentVerified: input.consentVerified,
    consentDate: input.consentDate,
    previousAssessment: input.previousAssessment,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    riskProfile: emptyRiskProfile(),
  };
  return student;
}

export async function updateStudent(id: string, input: Partial<CreateStudentInput>) {
  if (!isDemoMode()) {
    const { data } = await api.patch<Student>(endpoints.student(id), input);
    return data;
  }
  throw new Error("Student profile edits are saved when the account service is connected.");
}

export async function deleteStudentRecord(id: string) {
  if (!isDemoMode()) {
    await api.delete(endpoints.student(id));
  }
}

export const studentService = {
  getAll: getStudents,
  getById: getStudent,
  create: createStudent,
  update: updateStudent,
  delete: deleteStudentRecord,
};
