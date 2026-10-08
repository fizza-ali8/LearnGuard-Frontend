export type RiskLevel = "low" | "moderate" | "elevated" | "high";

export type ImpactLevel = "low" | "moderate" | "high";

export type AssessmentType = "dyslexia" | "dysgraphia" | "adhd";

export type ScreeningStatus = "not_started" | "partial" | "complete";

export type NotificationType =
  | "elevated_result"
  | "report_generated"
  | "behaviour_logged"
  | "pending_assessment";

export type AssessmentStatus = "draft" | "ready" | "processing" | "completed" | "failed";

export type QualityBand = "poor" | "fair" | "good";

export interface ImageQuality {
  writingDetected: boolean;
  resolution: QualityBand;
  contrast: QualityBand;
  blur: "low" | "medium" | "high";
  orientation: "correct" | "incorrect";
  warning?: string;
}

export interface AssessmentModelMetadata {
  name: string;
  version?: string;
  explanationMethod?: string;
  datasetVersion?: string;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  assessedAt?: string;
  confidence?: number;
  researchScreen?: "elevated_pattern" | "no_elevated_pattern";
  researchMessage?: string;
}

export interface AdhdTopFactor {
  feature: string;
  question: string;
  answer: string;
  direction: "toward_flag" | "away_from_flag";
}

export interface AdhdModelResult {
  screenPositive: boolean;
  message: string;
  disclaimer: string;
  modelVersion: string;
  /** Research-model output used with the saved threshold. Not a diagnosis probability. */
  modelScore?: number;
  topFactors: AdhdTopFactor[];
}

export interface RiskProfile {
  dyslexia?: RiskResult;
  dysgraphia?: RiskResult;
  adhd?: RiskResult;
  overallConcern?: RiskLevel;
  overallNote?: string;
}

export interface Student {
  id: string;
  code: string;
  name: string;
  grade: string;
  age: number;
  school: string;
  section: string;
  consentVerified: boolean;
  consentDate?: string;
  previousAssessment: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  riskProfile: RiskProfile;
}

export interface ExplanationFactor {
  label: string;
  impact: ImpactLevel;
  direction?: "increase" | "decrease";
  value?: number;
  detail?: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  type: AssessmentType;
  score: number;
  riskLevel: RiskLevel;
  createdAt: string;
  teacher: string;
  explanation: string;
  factors: ExplanationFactor[];
  recommendation: string;
  confidence?: number;
  inputQuality?: string;
  modelName?: string;
  modelVersion?: string;
  explanationMethod?: string;
  datasetVersion?: string;
  passageTitle?: string;
  passage?: string;
  audioDurationSec?: number;
  transcriptAvailable?: boolean;
  imageDataUrl?: string;
  explanationImageUrl?: string;
  quality?: ImageQuality;
  isDemo?: boolean;
  respondentRelationship?: string;
  questionnaireSummary?: { section: string; label: string; answer: string }[];
  adhdResult?: AdhdModelResult;
  status?: AssessmentStatus;
  model?: AssessmentModelMetadata;
}

export type ResponseToInstructions =
  | "immediate"
  | "minor_delay"
  | "repeated_prompting"
  | "significant_difficulty";

export type Frequency = "never" | "rarely" | "sometimes" | "often" | "very_often";

export interface BehaviourObservation {
  id: string;
  studentId: string;
  date: string;
  subject: string;
  durationMin: number;
  environment: string;
  teacher: string;
  sustainedAttentionMin: number;
  offTaskEvents: number;
  instructionsRepeated: number;
  responseToInstructions: ResponseToInstructions;
  taskCompletionPct: number;
  taskCompletionTimeMin: number;
  taskAbandonment: Frequency;
  consistency: 1 | 2 | 3 | 4 | 5;
  seatLeaving: number;
  interruptions: number;
  restlessness: number;
  impulsiveResponses: number;
  notes?: string;
  score: number;
  riskLevel: RiskLevel;
}

export interface Report {
  id: string;
  studentId: string;
  createdAt: string;
  included: AssessmentType[];
  generatedBy: string;
  status: "ready" | "draft";
}

export interface AppNotification {
  id: string;
  kind: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  href?: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  detail: string;
  riskLevel?: RiskLevel;
  createdAt: string;
  href: string;
}

export interface CreateStudentInput {
  code: string;
  name: string;
  age: number;
  grade: string;
  school: string;
  section: string;
  previousAssessment: boolean;
  notes?: string;
  consentVerified: boolean;
  consentDate: string;
}

export interface CreateAssessmentInput {
  studentId: string;
  type: AssessmentType;
  audioDurationSec?: number;
  passageTitle?: string;
  passage?: string;
  transcriptAvailable?: boolean;
  imageDataUrl?: string;
  inputQuality?: string;
  /** Demo-only score override. Live mode ignores this and uses the model response. */
  score?: number;
  quality?: ImageQuality;
  file?: File;
}

export interface HelpArticle {
  id: string;
  category: string;
  question: string;
  answer: string;
}
