import { levelFromScore } from "@/lib/risk";
import { clamp } from "@/lib/utils";
import type { BehaviourObservation, ResponseToInstructions } from "@/types";

const responseWeight: Record<ResponseToInstructions, number> = {
  immediate: 8,
  minor_delay: 28,
  repeated_prompting: 62,
  significant_difficulty: 88,
};

export type ObservationDraft = Omit<BehaviourObservation, "id" | "score" | "riskLevel">;

export function scoreObservation(draft: ObservationDraft) {
  const attentionConcern = clamp((1 - draft.sustainedAttentionMin / Math.max(draft.durationMin, 1)) * 100);
  const offTaskConcern = clamp((draft.offTaskEvents / 12) * 100);
  const completionConcern = clamp(100 - draft.taskCompletionPct);
  const restlessConcern = clamp((draft.restlessness / 5) * 100);
  const interruptionConcern = clamp((draft.interruptions / 8) * 100);
  const responseConcern = responseWeight[draft.responseToInstructions];
  const score = Math.round(
    attentionConcern * 0.28 +
      offTaskConcern * 0.26 +
      completionConcern * 0.16 +
      restlessConcern * 0.1 +
      interruptionConcern * 0.08 +
      responseConcern * 0.12,
  );
  const riskLevel = levelFromScore(score);
  return { score, riskLevel, attentionConcern, offTaskConcern, completionConcern };
}
