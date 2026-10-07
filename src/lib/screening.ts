import { isDemoMode } from "@/lib/api";
import { MODEL_META, TEACHER } from "@/lib/constants";
import { levelFromScore } from "@/lib/risk";
import type { Assessment, AssessmentType, ExplanationFactor, ImageQuality, RiskLevel } from "@/types";

export function factorsFor(type: AssessmentType, score: number): ExplanationFactor[] {
  if (type === "dyslexia") {
    if (score >= 60) {
      return [
        { label: "Reading Rate", impact: "high", direction: "increase", value: Math.min(92, score + 12), detail: "Slower than the grade passage expects" },
        { label: "Word Omissions", impact: "high", direction: "increase", value: Math.min(88, score + 4), detail: "Repeated omissions during oral reading" },
        { label: "Pause Frequency", impact: "moderate", direction: "increase", value: 54, detail: "Longer pauses between phrases" },
        { label: "Reading Accuracy", impact: "low", direction: "increase", value: 28, detail: "Smaller influence than rate and omissions" },
      ];
    }
    if (score >= 40) {
      return [
        { label: "Reading Rate", impact: "moderate", direction: "increase", value: 58, detail: "Somewhat slower than expected" },
        { label: "Word Omissions", impact: "moderate", direction: "increase", value: 46, detail: "A few omissions were observed" },
        { label: "Pause Frequency", impact: "low", direction: "increase", value: 32, detail: "Pauses were mostly brief" },
        { label: "Reading Accuracy", impact: "low", direction: "decrease", value: 22, detail: "Accuracy stayed closer to the expected range" },
      ];
    }
    return [
      { label: "Reading Rate", impact: "low", direction: "decrease", value: 18, detail: "Pace sat within the expected range" },
      { label: "Word Omissions", impact: "low", direction: "decrease", value: 12, detail: "Few omissions were detected" },
      { label: "Pause Frequency", impact: "low", direction: "decrease", value: 16, detail: "Pauses were brief" },
      { label: "Reading Accuracy", impact: "low", direction: "decrease", value: 14, detail: "Accuracy supported a lower concern" },
    ];
  }

  if (type === "dysgraphia") {
    if (score >= 60) {
      return [
        { label: "Spacing Consistency", impact: "high", direction: "increase", value: 82, detail: "High variation" },
        { label: "Character Size", impact: "moderate", direction: "increase", value: 61, detail: "Moderate variation" },
        { label: "Baseline Alignment", impact: "moderate", direction: "increase", value: 55, detail: "Moderate deviation" },
        { label: "Stroke Density", impact: "low", direction: "decrease", value: 24, detail: "Within expected range" },
      ];
    }
    if (score >= 40) {
      return [
        { label: "Spacing Consistency", impact: "moderate", direction: "increase", value: 52, detail: "Some uneven gaps" },
        { label: "Character Size", impact: "moderate", direction: "increase", value: 47, detail: "Moderate variation" },
        { label: "Baseline Alignment", impact: "low", direction: "increase", value: 34, detail: "Mostly aligned" },
        { label: "Stroke Density", impact: "low", direction: "decrease", value: 20, detail: "Within expected range" },
      ];
    }
    return [
      { label: "Spacing Consistency", impact: "low", direction: "decrease", value: 22, detail: "Even spacing" },
      { label: "Character Size", impact: "low", direction: "decrease", value: 18, detail: "Stable size" },
      { label: "Baseline Alignment", impact: "low", direction: "decrease", value: 16, detail: "Aligned to the line" },
      { label: "Stroke Density", impact: "low", direction: "decrease", value: 14, detail: "Within expected range" },
    ];
  }

  if (score >= 60) {
    return [
      { label: "Frequent off-task behaviour", impact: "high", direction: "increase", value: 84, detail: "High impact" },
      { label: "Short sustained-attention periods", impact: "high", direction: "increase", value: 79, detail: "High impact" },
      { label: "Variable task completion", impact: "moderate", direction: "increase", value: 57, detail: "Moderate impact" },
      { label: "Instructions repeated", impact: "low", direction: "increase", value: 31, detail: "Smaller additional influence" },
    ];
  }
  if (score >= 40) {
    return [
      { label: "Off-task behaviour", impact: "moderate", direction: "increase", value: 56, detail: "Moderate impact" },
      { label: "Sustained attention", impact: "moderate", direction: "increase", value: 49, detail: "Attention varied across the session" },
      { label: "Task completion", impact: "low", direction: "increase", value: 33, detail: "Most of the task was finished" },
      { label: "Restlessness", impact: "low", direction: "increase", value: 28, detail: "Limited influence" },
    ];
  }
  return [
    { label: "Sustained attention", impact: "low", direction: "decrease", value: 18, detail: "Attention was mostly sustained" },
    { label: "Off-task behaviour", impact: "low", direction: "decrease", value: 14, detail: "Few off-task events" },
    { label: "Task completion", impact: "low", direction: "decrease", value: 12, detail: "The task was largely completed" },
    { label: "Restlessness", impact: "low", direction: "decrease", value: 10, detail: "Little restlessness recorded" },
  ];
}

export function explanationFor(type: AssessmentType, level: RiskLevel) {
  if (type === "dyslexia") {
    if (level === "elevated" || level === "high") {
      return "The screening score was mainly influenced by slower reading speed, repeated word omissions and longer pauses during oral reading.";
    }
    if (level === "moderate") {
      return "Reading rate and a small number of omissions contributed to a moderate screening concern. Accuracy remained closer to the expected range.";
    }
    return "Reading rate, omissions and pauses sat within the expected range for this passage and grade.";
  }
  if (type === "dysgraphia") {
    if (level === "elevated" || level === "high") {
      return "Areas containing inconsistent character spacing and size variation contributed most strongly to the model’s screening output.";
    }
    if (level === "moderate") {
      return "Moderate variation in spacing and baseline alignment influenced the screening result. Stroke density stayed closer to the expected range.";
    }
    return "Spacing, character size and baseline alignment stayed within the expected range for this handwriting sample.";
  }
  if (level === "elevated" || level === "high") {
    return "Frequent off-task behaviour and shorter sustained-attention periods contributed most strongly to the current screening concern.";
  }
  if (level === "moderate") {
    return "Attention varied across the session and task completion was uneven. These patterns contributed to a moderate screening concern.";
  }
  return "Sustained attention and task completion were broadly consistent during the recorded observations.";
}

export function recommendationFor(level: RiskLevel) {
  if (level === "low") {
    return "Continue regular classroom support. Repeat screening next term, or sooner if new concerns appear.";
  }
  if (level === "moderate") {
    return "Continue structured classroom observation and review progress at the next screening point.";
  }
  return "Continue structured classroom observation and consider referral to a qualified educational specialist if these concerns persist.";
}

export function buildAssessment(input: {
  id: string;
  studentId: string;
  type: AssessmentType;
  score: number;
  createdAt: string;
  teacher?: string;
  audioDurationSec?: number;
  passageTitle?: string;
  passage?: string;
  transcriptAvailable?: boolean;
  imageDataUrl?: string;
  inputQuality?: string;
  quality?: ImageQuality;
  explanationImageUrl?: string;
}): Assessment {
  const riskLevel = levelFromScore(input.score);
  const meta = MODEL_META[input.type];
  return {
    id: input.id,
    studentId: input.studentId,
    type: input.type,
    score: input.score,
    riskLevel,
    createdAt: input.createdAt,
    teacher: input.teacher ?? TEACHER.name,
    explanation: explanationFor(input.type, riskLevel),
    factors: factorsFor(input.type, input.score),
    recommendation: recommendationFor(riskLevel),
    inputQuality: input.inputQuality ?? "Good",
    quality: input.quality,
    explanationImageUrl: input.explanationImageUrl,
    isDemo: isDemoMode(),
    status: "completed",
    modelName: meta.model,
    modelVersion: meta.version,
    explanationMethod: meta.method,
    datasetVersion: meta.dataset,
    model: {
      name: meta.model,
      version: meta.version,
      explanationMethod: meta.method,
      datasetVersion: meta.dataset,
    },
    passageTitle: input.passageTitle,
    passage: input.passage,
    audioDurationSec: input.audioDurationSec,
    transcriptAvailable: input.transcriptAvailable,
    imageDataUrl: input.imageDataUrl,
  };
}
