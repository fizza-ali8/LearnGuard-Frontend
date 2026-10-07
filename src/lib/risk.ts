import type { AssessmentType, RiskLevel, RiskProfile, ScreeningStatus, Student } from "@/types";

export const RISK_LEVELS: RiskLevel[] = ["low", "moderate", "elevated", "high"];

export const riskLabel: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  elevated: "Elevated",
  high: "High",
};

export const riskPhrase: Record<RiskLevel, string> = {
  low: "Low screening risk",
  moderate: "Moderate screening risk",
  elevated: "Elevated screening risk",
  high: "High screening risk",
};

export const moduleLabel: Record<AssessmentType, string> = {
  dyslexia: "Dyslexia",
  dysgraphia: "Dysgraphia",
  adhd: "ADHD-related",
};

export const moduleFullLabel: Record<AssessmentType, string> = {
  dyslexia: "Dyslexia screening",
  dysgraphia: "Dysgraphia screening",
  adhd: "ADHD-related screening",
};

const rank: Record<RiskLevel, number> = {
  low: 0,
  moderate: 1,
  elevated: 2,
  high: 3,
};

export const OVERALL_CONCERN_NOTE =
  "Overall concern reflects the highest current screening concern across completed modules. It is not a combined diagnostic probability.";

export function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return "high";
  if (score >= 60) return "elevated";
  if (score >= 40) return "moderate";
  return "low";
}

export function concernRank(level?: RiskLevel) {
  return level ? rank[level] : -1;
}

export function highestConcern(profile: RiskProfile): RiskLevel | undefined {
  const levels = [profile.dyslexia?.level, profile.dysgraphia?.level, profile.adhd?.level].filter(
    (level): level is RiskLevel => Boolean(level),
  );
  if (!levels.length) return undefined;
  return levels.sort((a, b) => rank[b] - rank[a])[0];
}

export function overallFromProfile(profile: RiskProfile): { level?: RiskLevel; note: string } {
  const entries = (
    [
      ["dyslexia", profile.dyslexia],
      ["dysgraphia", profile.dysgraphia],
      ["adhd", profile.adhd],
    ] as const
  ).filter((entry) => entry[1]);

  if (!entries.length) {
    return { note: "No screening results have been recorded yet." };
  }

  const top = [...entries].sort((a, b) => {
    const byLevel = rank[b[1]!.level] - rank[a[1]!.level];
    if (byLevel !== 0) return byLevel;
    return b[1]!.score - a[1]!.score;
  })[0];

  const level = top[1]!.level;
  if (level === "low") {
    return {
      level,
      note: "Recorded screening results currently sit in the low concern range.",
    };
  }

  return {
    level,
    note: `Current concern is driven primarily by the ${moduleLabel[top[0]].toLowerCase()} screening result.`,
  };
}

export function screeningStatus(student: Student): ScreeningStatus {
  const count = [student.riskProfile.dyslexia, student.riskProfile.dysgraphia, student.riskProfile.adhd].filter(Boolean)
    .length;
  if (count === 0) return "not_started";
  if (count === 3) return "complete";
  return "partial";
}

export function statusLabel(status: ScreeningStatus) {
  if (status === "complete") return "Fully screened";
  if (status === "partial") return "Partially screened";
  return "Not started";
}

export function isActionable(level?: RiskLevel) {
  return level === "elevated" || level === "high";
}

export function riskTone(level: RiskLevel) {
  return {
    low: { text: "text-risk-low", bg: "bg-risk-low-bg", bar: "bg-risk-low", soft: "#16A34A" },
    moderate: { text: "text-risk-moderate", bg: "bg-risk-moderate-bg", bar: "bg-risk-moderate", soft: "#D97706" },
    elevated: { text: "text-risk-elevated", bg: "bg-risk-elevated-bg", bar: "bg-risk-elevated", soft: "#EA580C" },
    high: { text: "text-risk-high", bg: "bg-risk-high-bg", bar: "bg-risk-high", soft: "#DC2626" },
  }[level];
}
