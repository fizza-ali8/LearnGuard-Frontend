import { endpoints } from "@/config/endpoints";
import { seedObservations } from "@/data/seed";
import { api, delay, isMockApi } from "@/lib/api";
import { scoreObservation, type ObservationDraft } from "@/lib/behaviour-score";
import type { BehaviourObservation } from "@/types";

export async function getObservations() {
  if (!isMockApi()) {
    const { data } = await api.get<BehaviourObservation[]>(endpoints.behaviour);
    return data;
  }
  await delay(150);
  return seedObservations;
}

export async function saveBehaviourObservation(draft: ObservationDraft) {
  if (!isMockApi()) {
    const { data } = await api.post<BehaviourObservation>(endpoints.behaviour, draft);
    return data;
  }
  await delay(260);
  const scored = scoreObservation(draft);
  const observation: BehaviourObservation = {
    ...draft,
    id: `obs-${Date.now()}`,
    score: scored.score,
    riskLevel: scored.riskLevel,
  };
  return observation;
}

export async function getObservationsByStudent(studentId: string) {
  const rows = await getObservations();
  return rows.filter((item) => item.studentId === studentId);
}

export const behaviourService = {
  getAll: getObservations,
  getByStudent: getObservationsByStudent,
  create: saveBehaviourObservation,
};
