import { endpoints } from "@/config/endpoints";
import { seedAssessments } from "@/data/seed";
import { api, delay, isDemoMode, isMockApi } from "@/lib/api";
import { DEMO_FIRST_SCREEN_SCORE, READING_PASSAGES } from "@/lib/constants";
import { levelFromScore } from "@/lib/risk";
import { buildAssessment } from "@/lib/screening";
import type { Assessment, CreateAssessmentInput, Student } from "@/types";

const endpointFor = {
  dyslexia: endpoints.dyslexiaAssessment,
  dysgraphia: endpoints.dysgraphiaAssessment,
  adhd: endpoints.adhdAssessment,
};

export async function getAssessments() {
  if (!isMockApi()) {
    const { data } = await api.get<Assessment[]>("/api/assessments");
    return data;
  }
  await delay(160);
  return seedAssessments;
}

export async function getStudentHistory(studentId: string) {
  if (!isMockApi()) {
    const { data } = await api.get<Assessment[]>(endpoints.studentHistory(studentId));
    return data;
  }
  await delay(140);
  return seedAssessments
    .filter((item) => item.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function toAssessmentScore(payload: { score?: number; probability?: number }) {
  if (typeof payload.score === "number") return payload.score;
  if (typeof payload.probability === "number") {
    return Math.round(payload.probability <= 1 ? payload.probability * 100 : payload.probability);
  }
  return undefined;
}

function liveBody(input: CreateAssessmentInput) {
  if (!input.file) return input;
  const body = new FormData();
  body.append("studentId", input.studentId);
  body.append("type", input.type);
  body.append("file", input.file);
  if (input.passage) body.append("passage", input.passage);
  if (input.passageTitle) body.append("passageTitle", input.passageTitle);
  if (input.audioDurationSec) body.append("audioDurationSec", String(input.audioDurationSec));
  return body;
}

export async function createAssessment(input: CreateAssessmentInput, student: Student) {
  if (!isDemoMode()) {
    const { data } = await api.post<Assessment & { probability?: number }>(endpointFor[input.type], liveBody(input));
    const score = toAssessmentScore(data);
    if (typeof score !== "number") throw new Error("The screening service did not return a score.");
    return { ...data, score, riskLevel: data.riskLevel ?? levelFromScore(score), isDemo: false };
  }
  await delay(420);
  const existing =
    input.type === "dyslexia"
      ? student.riskProfile.dyslexia
      : input.type === "dysgraphia"
        ? student.riskProfile.dysgraphia
        : student.riskProfile.adhd;
  const passage = READING_PASSAGES[student.grade] ?? READING_PASSAGES[String(3)];
  const score = input.score ?? existing?.score ?? DEMO_FIRST_SCREEN_SCORE[input.type];
  return buildAssessment({
    id: `asm-${Date.now()}`,
    studentId: student.id,
    type: input.type,
    score,
    createdAt: new Date().toISOString(),
    audioDurationSec: input.audioDurationSec,
    passageTitle: input.passageTitle ?? (input.type === "dyslexia" ? passage.title : undefined),
    passage: input.passage ?? (input.type === "dyslexia" ? passage.text : undefined),
    transcriptAvailable: input.transcriptAvailable,
    imageDataUrl: input.imageDataUrl,
    inputQuality: input.inputQuality ?? "Good",
    quality: input.quality,
  });
}

export async function getAssessmentById(id: string) {
  if (!isDemoMode()) {
    const { data } = await api.get<Assessment>(`/api/assessments/${id}`);
    const score = toAssessmentScore(data);
    return typeof score === "number" ? { ...data, score, isDemo: false } : data;
  }
  await delay(80);
  return seedAssessments.find((item) => item.id === id) ?? null;
}

export const assessmentService = {
  getAll: getAssessments,
  getById: getAssessmentById,
  getByStudent: getStudentHistory,
  runDyslexia: (input: CreateAssessmentInput, student: Student) => createAssessment({ ...input, type: "dyslexia" }, student),
  runDysgraphia: (input: CreateAssessmentInput, student: Student) => createAssessment({ ...input, type: "dysgraphia" }, student),
  runADHD: (input: CreateAssessmentInput, student: Student) => createAssessment({ ...input, type: "adhd" }, student),
};
