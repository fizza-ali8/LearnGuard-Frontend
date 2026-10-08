import questionnaireFile from "../../models/ADHD/adhd_caregiver_questions_frontend.json";

export const ADHD_MIN_AGE = 6;
export const ADHD_MAX_AGE = 11;

export interface AdhdOption {
  label: string;
  value: number;
}

export interface AdhdQuestion {
  number: number;
  featureKey: string;
  section: string;
  question: string;
  required: boolean;
  options: AdhdOption[];
  helpText?: string;
}

interface FrontendQuestion {
  number: number;
  feature_key: string;
  section: string;
  question: string;
  required: boolean;
  options: AdhdOption[];
  help_text?: string;
}

const source = questionnaireFile as {
  instructions: string;
  screening_disclaimer: string;
  questions: FrontendQuestion[];
};

export const ADHD_INSTRUCTIONS = source.instructions;
export const ADHD_SCREENING_DISCLAIMER = source.screening_disclaimer;

/** Official caregiver questionnaire. Option values are model codes and are not shown in the UI. */
export const ADHD_QUESTIONS: AdhdQuestion[] = source.questions.map((question) => ({
  number: question.number,
  featureKey: question.feature_key,
  section: question.section,
  question: question.question,
  required: question.required,
  options: question.options.map((option) => ({ label: option.label, value: option.value })),
  helpText: question.help_text,
}));

export const ADHD_SECTIONS: string[] = ADHD_QUESTIONS.reduce<string[]>((sections, question) => {
  if (!sections.includes(question.section)) sections.push(question.section);
  return sections;
}, []);

export const ADHD_FEATURE_LABELS: Record<string, string> = {
  sc_age_years: "Age",
  memorycond: "Serious concentration or memory difficulty",
  k7q70_r: "Argues too much",
  k7q82_r: "Cares about doing well in school",
  k7q83_r: "Completes required homework",
  k7q84_r: "Works to finish tasks",
  k7q85_r: "Stays calm under challenge",
  grades: "School grades",
  k7q04r_r: "School contacts about problems",
  makefriend: "Difficulty making or keeping friends",
  hoursleep: "Weeknight sleep duration",
  bedtime: "Consistent bedtime",
  screentime: "Non-school screen time",
  bully: "Bullying others",
  bullied_r: "Being bullied",
  physactiv: "Physical activity",
  repeated: "Repeated a grade",
  k7q30: "Sports participation",
  k7q31: "Club participation",
  k7q32: "Other organized activities",
};

export const ADHD_RESPONDENTS = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "guardian", label: "Guardian" },
  { value: "other_caregiver", label: "Other adult caregiver" },
] as const;

export type AdhdRespondent = (typeof ADHD_RESPONDENTS)[number]["value"];

export type AdhdAnswers = Record<string, number>;

export function isAdhdEligible(age: number) {
  return age >= ADHD_MIN_AGE && age <= ADHD_MAX_AGE;
}

export function adhdDraftKey(studentId: string) {
  return `learnguard-adhd-questionnaire-${studentId}`;
}

export function questionsInSection(section: string, questions: AdhdQuestion[] = ADHD_QUESTIONS) {
  return questions.filter((question) => question.section === section).sort((a, b) => a.number - b.number);
}

export function answerLabel(question: AdhdQuestion, value: number | undefined) {
  if (typeof value !== "number") return "";
  return question.options.find((option) => option.value === value)?.label ?? "";
}

export function answeredCount(answers: AdhdAnswers, questions: AdhdQuestion[] = ADHD_QUESTIONS) {
  return questions.filter((question) => typeof answers[question.featureKey] === "number").length;
}

export function firstUnanswered(answers: AdhdAnswers, questions: AdhdQuestion[] = ADHD_QUESTIONS) {
  return questions.find((question) => typeof answers[question.featureKey] !== "number");
}

export function respondentLabel(value?: string) {
  return ADHD_RESPONDENTS.find((item) => item.value === value)?.label ?? "Caregiver";
}

export function featureLabel(keyOrLabel: string) {
  return ADHD_FEATURE_LABELS[keyOrLabel] ?? keyOrLabel;
}

export const ADHD_MODEL_DISCLAIMER =
  "Research prototype using a US survey. Not a diagnosis, a validated clinical screening instrument, or a replacement for professional evaluation.";

export function adhdScreenMessage(screenPositive: boolean) {
  return screenPositive
    ? "Elevated ADHD-related screening pattern. Consider discussing concerns with a qualified professional."
    : "No elevated pattern at this research threshold. This does not rule out ADHD; seek advice if concerns persist.";
}

export function adhdScreenStatus(screenPositive: boolean) {
  return screenPositive
    ? "Elevated ADHD-related screening pattern"
    : "No elevated pattern at the research threshold";
}

export function sectionsFor(questions: AdhdQuestion[]) {
  const present = new Set(questions.map((question) => question.section));
  const known = ADHD_SECTIONS.filter((section) => present.has(section));
  const extra = [...present].filter((section) => !known.includes(section));
  return [...known, ...extra];
}
