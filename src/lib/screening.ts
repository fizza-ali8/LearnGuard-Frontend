import {
  ADHD_MODEL_DISCLAIMER,
  adhdScreenMessage,
  featureLabel,
} from "@/data/adhd-questionnaire";
import { isDemoMode } from "@/lib/api";
import { MODEL_META, TEACHER } from "@/lib/constants";
import { levelFromScore } from "@/lib/risk";
import type { Assessment, AssessmentType, ExplanationFactor, ImageQuality, RiskLevel, RiskResult } from "@/types";

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
      { label: "Serious concentration or memory difficulty", impact: "high", detail: "Stronger influence on this screening prediction" },
      { label: "Works to finish tasks", impact: "high", detail: "Stronger influence on this screening prediction" },
      { label: "Weeknight sleep duration", impact: "moderate", detail: "Moderate influence on this screening prediction" },
      { label: "Difficulty making or keeping friends", impact: "low", detail: "Smaller additional influence" },
    ];
  }
  if (score >= 40) {
    return [
      { label: "Works to finish tasks", impact: "moderate", detail: "Moderate influence on this screening prediction" },
      { label: "School contacts about problems", impact: "moderate", detail: "Moderate influence on this screening prediction" },
      { label: "Weeknight sleep duration", impact: "low", detail: "Smaller additional influence" },
      { label: "Non-school screen time", impact: "low", detail: "Smaller additional influence" },
    ];
  }
  return [
    { label: "Cares about doing well in school", impact: "low", detail: "Supported a lower screening concern" },
    { label: "Works to finish tasks", impact: "low", detail: "Supported a lower screening concern" },
    { label: "Weeknight sleep duration", impact: "low", detail: "Supported a lower screening concern" },
    { label: "Difficulty making or keeping friends", impact: "low", detail: "Limited influence" },
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
    return "The questionnaire indicates an elevated ADHD-related screening concern. The responses below had the strongest influence on the model prediction. They do not show that any answer caused ADHD.";
  }
  if (level === "moderate") {
    return "The questionnaire indicates a moderate ADHD-related screening concern. These caregiver responses had the strongest influence on the model prediction. They do not establish a cause.";
  }
  return "The caregiver responses used by the screening model currently sit in a lower concern range. Influence scores describe the prediction. They do not establish a cause.";
}

export function recommendationFor(level: RiskLevel, type?: AssessmentType) {
  if (type === "adhd") {
    if (level === "low") {
      return "The questionnaire does not indicate an elevated ADHD-related screening concern. Continue regular classroom support, and repeat screening if new concerns appear.";
    }
    if (level === "moderate") {
      return "The questionnaire indicates a moderate ADHD-related screening concern. Continue structured support and review at the next screening point.";
    }
    return "The questionnaire indicates an elevated ADHD-related screening concern. Consider discussing persistent concerns with a qualified healthcare or educational professional.";
  }
  if (level === "low") {
    return "Continue regular classroom support. Repeat screening next term, or sooner if new concerns appear.";
  }
  if (level === "moderate") {
    return "Continue structured classroom observation and review progress at the next screening point.";
  }
  return "Continue structured classroom observation and consider referral to a qualified educational specialist if these concerns persist.";
}

export function adhdConcernLevel(screenPositive: boolean): RiskLevel {
  return screenPositive ? "elevated" : "low";
}

/** Older demonstration records used a percentage. The live model only has two outcomes. */
export function legacyAdhdScreenPositive(score: number, level?: RiskLevel) {
  return level === "elevated" || level === "high" || score >= 60;
}

export function legacyAdhdRisk(score: number, assessedAt?: string, level?: RiskLevel): RiskResult {
  const screenPositive = legacyAdhdScreenPositive(score, level);
  return {
    score: 0,
    level: adhdConcernLevel(screenPositive),
    assessedAt,
    researchScreen: screenPositive ? "elevated_pattern" : "no_elevated_pattern",
    researchMessage: adhdScreenMessage(screenPositive),
  };
}

export function adhdRiskFromAssessment(assessment: Assessment): RiskResult {
  const screenPositive = Boolean(assessment.adhdResult?.screenPositive);
  return {
    score: 0,
    level: adhdConcernLevel(screenPositive),
    assessedAt: assessment.createdAt,
    researchScreen: screenPositive ? "elevated_pattern" : "no_elevated_pattern",
    researchMessage: assessment.adhdResult?.message,
  };
}

/** Turns a percentage-style ADHD record into the same binary screen the live model returns. */
export function repairAdhdAssessment(assessment: Assessment): Assessment {
  if (assessment.type !== "adhd") return assessment;
  if (!assessment.adhdResult) {
    const screenPositive = legacyAdhdScreenPositive(assessment.score ?? 0, assessment.riskLevel);
    const level = adhdConcernLevel(screenPositive);
    const message = adhdScreenMessage(screenPositive);
    return {
      ...assessment,
      score: 0,
      riskLevel: level,
      isDemo: true,
      explanation: explanationFor("adhd", level),
      recommendation: recommendationFor(level, "adhd"),
      modelName: assessment.modelName ?? MODEL_META.adhd.model,
      modelVersion: "demonstration",
      explanationMethod: MODEL_META.adhd.method,
      datasetVersion: MODEL_META.adhd.dataset,
      adhdResult: {
        screenPositive,
        message,
        disclaimer: ADHD_MODEL_DISCLAIMER,
        modelVersion: "demonstration",
        topFactors: assessment.factors.slice(0, 5).map((factor) => ({
          feature: factor.label,
          question: featureLabel(factor.label),
          answer: factor.detail ?? factor.label,
          direction: screenPositive ? "toward_flag" as const : "away_from_flag" as const,
        })),
      },
    };
  }

  const level = adhdConcernLevel(assessment.adhdResult.screenPositive);
  const message = assessment.adhdResult.message;
  return {
    ...assessment,
    score: 0,
    riskLevel: level,
    modelName: assessment.modelName ?? MODEL_META.adhd.model,
    modelVersion: assessment.modelVersion ?? assessment.adhdResult.modelVersion,
    explanationMethod: assessment.explanationMethod ?? MODEL_META.adhd.method,
    datasetVersion: assessment.datasetVersion ?? MODEL_META.adhd.dataset,
    explanation: assessment.explanation === message ? explanationFor("adhd", level) : assessment.explanation,
    recommendation: !assessment.recommendation || assessment.recommendation === message ? recommendationFor(level, "adhd") : assessment.recommendation,
    factors: assessment.adhdResult.topFactors.length
      ? assessment.adhdResult.topFactors.map((factor) => ({
          label: factor.question || featureLabel(factor.feature),
          impact: factor.direction === "toward_flag" ? "high" as const : "low" as const,
          detail: factor.answer,
        }))
      : assessment.factors,
  };
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
    recommendation: recommendationFor(riskLevel, input.type),
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
