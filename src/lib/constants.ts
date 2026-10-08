import type { AssessmentType } from "@/types";
import {
  Activity,
  ChartNoAxesCombined,
  CircleQuestionMark,
  ClipboardPlus,
  FileText,
  Grid3x3,
  History,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export const PRODUCT = {
  name: "LearnGuard",
  tagline: "Earlier insight. Better support.",
  subtitle: "Early Learning Screening",
  disclaimer:
    "LearnGuard provides AI-assisted screening support and does not replace professional assessment.",
  shortDisclaimer: "AI-assisted educational screening support. Not a clinical diagnostic system.",
  resultDisclaimer: "This result indicates screening concern and is not a clinical diagnosis.",
  reportDisclaimer:
    "This report represents AI-assisted educational screening and does not constitute a clinical diagnosis.",
  explanationDisclaimer:
    "Model explanations describe which inputs influenced the prediction and do not establish medical causation.",
};

export const TEACHER = {
  name: "Ms. Sarah Ahmed",
  shortName: "Ms. Sarah",
  role: "Teacher",
  email: "sarah.ahmed@horizonprimary.edu",
  school: "Horizon Primary School",
};

export const DEMO_PASSWORD = "LearnGuard2026";

export const SCHOOL = "Horizon Primary School";

export const SUPPORTED_GRADES = [3, 4, 5, 6] as const;
export const GRADES = SUPPORTED_GRADES.map((grade) => String(grade));

export const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: LucideIcon; match: string }[];
}[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: "/dashboard" },
      { href: "/students", label: "Students", icon: Users, match: "/students" },
      { href: "/assessment/new", label: "New Assessment", icon: ClipboardPlus, match: "/assessment" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { href: "/behaviour", label: "Behaviour Logs", icon: Activity, match: "/behaviour" },
      { href: "/heatmap", label: "Class Heatmap", icon: Grid3x3, match: "/heatmap" },
      { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined, match: "/analytics" },
      { href: "/history", label: "History", icon: History, match: "/history" },
    ],
  },
  {
    label: "Records",
    items: [{ href: "/reports", label: "Reports", icon: FileText, match: "/reports" }],
  },
  {
    label: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings, match: "/settings" },
      { href: "/help", label: "Help", icon: CircleQuestionMark, match: "/help" },
    ],
  },
];

export const READING_PASSAGES: Record<string, { title: string; text: string }> = {
  "3": {
    title: "The Red Kite",
    text: "Mina saw a red kite above the park. She held her brother’s hand and counted the trees as they walked. The kite dipped, then rose again. Mina read the words on the sign by the gate, slowly and clearly, and then they went to sit on the bench.",
  },
  "4": {
    title: "Market Morning",
    text: "The morning market was already busy when Lina and her brother arrived. They counted the red apples, then the yellow ones, and wrote the numbers in a small notebook. A breeze lifted the pages, so Lina held them down and read the list again, slowly and clearly.",
  },
  "5": {
    title: "The Library Clock",
    text: "The library clock chimed as Amir pushed open the heavy door. He found the science shelf, checked the numbers on the spines, and carried two books to a quiet table. He read the first paragraph aloud, pausing only when a word felt unfamiliar, then continued to the end of the page.",
  },
  "6": {
    title: "River Path",
    text: "Hana followed the river path after school, notebook tucked under her arm. She stopped at the footbridge and described what she could see: the current, the reeds, and a boat tied near the steps. She then read her notes back from the beginning, keeping an even pace until the last line.",
  },
};

/** Used only when a demo screening has no prior module score and no observation score. */
export const DEMO_FIRST_SCREEN_SCORE: Record<AssessmentType, number> = {
  dyslexia: 64,
  dysgraphia: 57,
  adhd: 61,
};

export const MODEL_META: Record<
  AssessmentType,
  { model: string; version: string; method: string; dataset: string }
> = {
  dyslexia: {
    model: "CNN Audio Classifier",
    version: "v2.1",
    method: "SHAP",
    dataset: "LG-READ-2026.1",
  },
  dysgraphia: {
    model: "Handwriting CNN",
    version: "v1.4",
    method: "Grad-CAM",
    dataset: "LG-WRITE-2026.1",
  },
  adhd: {
    model: "Gradient Boosted Observation Model",
    version: "v1.2",
    method: "SHAP",
    dataset: "LG-OBS-2026.1",
  },
};

export const RESPONSE_OPTIONS = [
  { value: "immediate", label: "Immediate" },
  { value: "minor_delay", label: "Minor delay" },
  { value: "repeated_prompting", label: "Repeated prompting" },
  { value: "significant_difficulty", label: "Significant difficulty" },
] as const;

export const FREQUENCY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "sometimes", label: "Sometimes" },
  { value: "often", label: "Often" },
  { value: "very_often", label: "Very often" },
] as const;

export const CONSISTENCY_OPTIONS = [
  { value: 1, label: "Very consistent" },
  { value: 2, label: "Mostly consistent" },
  { value: 3, label: "Mixed" },
  { value: 4, label: "Inconsistent" },
  { value: 5, label: "Very inconsistent" },
] as const;

export const HELP_CATEGORIES = [
  "Getting Started",
  "Running a Dyslexia Screening",
  "Uploading Handwriting",
  "Recording Behaviour",
  "Understanding Risk Scores",
  "Understanding Explanations",
  "Reports",
  "Privacy & Consent",
] as const;
