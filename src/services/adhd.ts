import { endpoints } from "@/config/endpoints";
import {
  ADHD_QUESTIONS,
  answerLabel,
  featureLabel,
  respondentLabel,
  type AdhdAnswers,
  type AdhdQuestion,
  type AdhdRespondent,
} from "@/data/adhd-questionnaire";
import { MODEL_META, TEACHER } from "@/lib/constants";
import { adhdConcernLevel, explanationFor, recommendationFor } from "@/lib/screening";
import type { AdhdModelResult, AdhdTopFactor, Assessment, Student } from "@/types";
import axios from "axios";

export interface AdhdSubmission {
  studentId: string;
  respondent: AdhdRespondent;
  answers: AdhdAnswers;
}

function summaryFor(answers: AdhdAnswers, questions: AdhdQuestion[]) {
  return questions.map((question) => ({
    section: question.section,
    label: featureLabel(question.featureKey) === question.featureKey ? question.question : featureLabel(question.featureKey),
    answer: answerLabel(question, answers[question.featureKey]),
  }));
}

function adhdServiceBase() {
  return (process.env.NEXT_PUBLIC_ADHD_API_URL || "").replace(/\/$/, "");
}

export async function getAdhdQuestions() {
  return ADHD_QUESTIONS;
}

interface PredictResponse {
  module: string;
  model_version?: string;
  model_score?: number;
  screen_positive: boolean;
  message: string;
  disclaimer: string;
  top_factors?: { feature?: string; question?: string; answer?: string; direction?: "toward_flag" | "away_from_flag" }[];
}

export async function predictAdhd(input: AdhdSubmission, student: Student, questions = ADHD_QUESTIONS): Promise<Assessment> {
  const summary = summaryFor(input.answers, questions);
  const respondentRelationship = respondentLabel(input.respondent);
  const answers: AdhdAnswers = {};
  questions.forEach((question) => {
    const value = input.answers[question.featureKey];
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw new Error("Every question needs one selected answer.");
    }
    answers[question.featureKey] = value;
  });

  let data: PredictResponse;
  try {
    const response = await axios.post<PredictResponse>(`${adhdServiceBase()}${endpoints.adhdPredict}`, { answers }, {
      timeout: 20000,
      headers: { "Content-Type": "application/json" },
    });
    data = response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 422) {
      const detail = error.response.data?.detail;
      throw new Error(typeof detail === "string" ? detail : "The questionnaire was rejected. Check every answer.");
    }
    throw new Error("The ADHD screening service is unavailable. Your answers are still saved. No result was created.");
  }

  if (typeof data.screen_positive !== "boolean" || typeof data.message !== "string" || typeof data.disclaimer !== "string") {
    throw new Error("The screening service returned an incomplete result. No result was saved.");
  }

  const topFactors: AdhdTopFactor[] = (Array.isArray(data.top_factors) ? data.top_factors : []).flatMap((factor) => {
    if (!factor || (factor.direction !== "toward_flag" && factor.direction !== "away_from_flag") || typeof factor.feature !== "string") {
      return [];
    }
    return [{
      feature: factor.feature,
      question: factor.question || featureLabel(factor.feature),
      answer: factor.answer || "",
      direction: factor.direction,
    }];
  });
  const modelScore = typeof data.model_score === "number" && data.model_score >= 0 && data.model_score <= 1
    ? data.model_score
    : undefined;
  const level = adhdConcernLevel(data.screen_positive);
  const adhdResult: AdhdModelResult = {
    screenPositive: data.screen_positive,
    message: data.message,
    disclaimer: data.disclaimer,
    modelVersion: data.model_version || MODEL_META.adhd.version,
    modelScore,
    topFactors,
  };

  return {
    id: `asm-${Date.now()}`,
    studentId: student.id,
    type: "adhd",
    score: 0,
    riskLevel: level,
    createdAt: new Date().toISOString(),
    teacher: TEACHER.name,
    explanation: explanationFor("adhd", level),
    factors: topFactors.map((factor) => ({
      label: factor.question || featureLabel(factor.feature),
      impact: factor.direction === "toward_flag" ? "high" as const : "low" as const,
      detail: factor.answer,
    })),
    recommendation: recommendationFor(level, "adhd"),
    modelName: MODEL_META.adhd.model,
    modelVersion: adhdResult.modelVersion,
    explanationMethod: MODEL_META.adhd.method,
    datasetVersion: MODEL_META.adhd.dataset,
    model: {
      name: MODEL_META.adhd.model,
      version: adhdResult.modelVersion,
      explanationMethod: MODEL_META.adhd.method,
      datasetVersion: MODEL_META.adhd.dataset,
    },
    isDemo: false,
    respondentRelationship,
    questionnaireSummary: summary,
    status: "completed",
    adhdResult,
  };
}
