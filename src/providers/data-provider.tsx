"use client";

import {
  seedAssessments,
  seedNotifications,
  seedObservations,
  seedReports,
  seedStudents,
} from "@/data/seed";
import { overallFromProfile } from "@/lib/risk";
import { createAssessment } from "@/services/assessments";
import { saveBehaviourObservation } from "@/services/behaviour";
import { generateReport } from "@/services/reports";
import { createStudent } from "@/services/students";
import type {
  ActivityItem,
  AppNotification,
  Assessment,
  AssessmentType,
  BehaviourObservation,
  CreateAssessmentInput,
  CreateStudentInput,
  Report,
  Student,
} from "@/types";
import type { ObservationDraft } from "@/lib/behaviour-score";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface StoreState {
  students: Student[];
  assessments: Assessment[];
  observations: BehaviourObservation[];
  reports: Report[];
  notifications: AppNotification[];
}

interface DataContextValue extends StoreState {
  ready: boolean;
  classScope: string;
  setClassScope: (value: string) => void;
  scopedStudents: Student[];
  sections: string[];
  activities: ActivityItem[];
  createStudentRecord: (input: CreateStudentInput) => Promise<Student>;
  deleteStudent: (id: string) => void;
  restoreDemo: () => void;
  runAssessment: (input: CreateAssessmentInput) => Promise<Assessment>;
  saveObservation: (draft: ObservationDraft) => Promise<BehaviourObservation>;
  createReport: (studentId: string) => Promise<Report>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);
const KEY = "learnguard-store-v1";

function seedState(): StoreState {
  return {
    students: seedStudents,
    assessments: seedAssessments,
    observations: seedObservations,
    reports: seedReports,
    notifications: seedNotifications,
  };
}

function applyAssessment(student: Student, assessment: Assessment): Student {
  const riskProfile = {
    ...student.riskProfile,
    [assessment.type]: {
      score: assessment.score,
      level: assessment.riskLevel,
      assessedAt: assessment.createdAt,
      confidence: assessment.confidence,
    },
  };
  const overall = overallFromProfile(riskProfile);
  return {
    ...student,
    updatedAt: assessment.createdAt,
    riskProfile: { ...riskProfile, overallConcern: overall.level, overallNote: overall.note },
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(seedState);
  const [ready, setReady] = useState(false);
  const [classScope, setClassScope] = useState("all");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate the demo store after mount */
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as StoreState;
        if (Array.isArray(parsed.students) && Array.isArray(parsed.assessments)) {
          setState({
            students: parsed.students,
            assessments: parsed.assessments,
            observations: parsed.observations ?? [],
            reports: parsed.reports ?? [],
            notifications: parsed.notifications ?? [],
          });
        }
      } catch {
        setState(seedState());
      }
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!ready) return;
    const write = () => {
      const assessments = state.assessments.some((item) => item.imageDataUrl)
        ? state.assessments.map(({ imageDataUrl: _image, ...assessment }) => assessment)
        : state.assessments;
      localStorage.setItem(KEY, JSON.stringify({ ...state, assessments }));
    };
    const timer = window.setTimeout(write, 200);
    const onHide = () => {
      if (document.visibilityState === "hidden") write();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [ready, state]);

  const value = useMemo<DataContextValue>(() => {
    const sections = Array.from(new Set(state.students.map((student) => student.section))).sort();
    const scopedStudents =
      classScope === "all" ? state.students : state.students.filter((student) => student.section === classScope);
    const names = new Map(state.students.map((student) => [student.id, student.name]));
    const studentName = (id: string) => names.get(id) ?? "Student";
    const recentAssessments = state.assessments.length > 8
      ? [...state.assessments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
      : state.assessments;
    const recentObservations = state.observations.length > 8
      ? [...state.observations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
      : state.observations;
    const activities: ActivityItem[] = [
      ...recentAssessments.map((assessment) => ({
        id: assessment.id,
        studentId: assessment.studentId,
        studentName: studentName(assessment.studentId),
        title:
          assessment.type === "dyslexia"
            ? "Dyslexia assessment completed"
            : assessment.type === "dysgraphia"
              ? "Handwriting screening completed"
              : "Behaviour screening updated",
        detail: assessment.explanation,
        riskLevel: assessment.riskLevel,
        createdAt: assessment.createdAt,
        href: `/results/${assessment.id}`,
      })),
      ...recentObservations.map((observation) => ({
        id: observation.id,
        studentId: observation.studentId,
        studentName: studentName(observation.studentId),
        title: "Behaviour observation added",
        detail: `${observation.subject} · ${observation.durationMin} min`,
        riskLevel: observation.riskLevel,
        createdAt: `${observation.date}T09:00:00`,
        href: `/behaviour/${observation.studentId}`,
      })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);

    return {
      ...state,
      ready,
      classScope,
      setClassScope,
      scopedStudents,
      sections,
      activities,
      async createStudentRecord(input) {
        const student = await createStudent(input, state.students);
        setState((current) => ({ ...current, students: [student, ...current.students] }));
        return student;
      },
      deleteStudent(id) {
        setState((current) => ({
          students: current.students.filter((student) => student.id !== id),
          assessments: current.assessments.filter((item) => item.studentId !== id),
          observations: current.observations.filter((item) => item.studentId !== id),
          reports: current.reports.filter((item) => item.studentId !== id),
          notifications: current.notifications,
        }));
      },
      restoreDemo() {
        localStorage.removeItem(KEY);
        setState(seedState());
      },
      async runAssessment(input) {
        const student = state.students.find((item) => item.id === input.studentId);
        if (!student) throw new Error("Student not found");
        const assessment = await createAssessment(input, student);
        setState((current) => ({
          ...current,
          assessments: [assessment, ...current.assessments],
          students: current.students.map((item) => (item.id === student.id ? applyAssessment(item, assessment) : item)),
          notifications:
            assessment.riskLevel === "elevated" || assessment.riskLevel === "high"
              ? [
                  {
                    id: `ntf-${Date.now()}`,
                    kind: "elevated_result" as const,
                    title: "Elevated screening result",
                    body: `${student.name} has a new ${assessment.riskLevel} screening result.`,
                    createdAt: assessment.createdAt,
                    href: `/results/${assessment.id}`,
                    read: false,
                  },
                  ...current.notifications,
                ]
              : current.notifications,
        }));
        return assessment;
      },
      async saveObservation(draft) {
        const observation = await saveBehaviourObservation(draft);
        const student = state.students.find((item) => item.id === draft.studentId);
        setState((current) => ({
          ...current,
          observations: [observation, ...current.observations],
          notifications: [
            {
              id: `ntf-${Date.now()}`,
              kind: "behaviour_logged" as const,
              title: "Observation saved",
              body: `Behaviour observation for ${student?.name ?? "the student"} was saved successfully.`,
              createdAt: new Date().toISOString(),
              href: `/behaviour/${draft.studentId}`,
              read: false,
            },
            ...current.notifications,
          ],
        }));
        return observation;
      },
      async createReport(studentId) {
        const student = state.students.find((item) => item.id === studentId);
        if (!student) throw new Error("Student not found");
        const included = (["dyslexia", "dysgraphia", "adhd"] as AssessmentType[]).filter(
          (type) => student.riskProfile[type],
        );
        const report = await generateReport(student, included);
        setState((current) => ({
          ...current,
          reports: [report, ...current.reports.filter((item) => item.studentId !== studentId || item.id !== report.id)],
          notifications: [
            {
              id: `ntf-${Date.now()}`,
              kind: "report_generated" as const,
              title: "Report generated",
              body: `Screening report for ${student.name} is ready to preview.`,
              createdAt: report.createdAt,
              href: `/reports/${student.id}`,
              read: false,
            },
            ...current.notifications,
          ],
        }));
        return report;
      },
      markNotificationRead(id) {
        setState((current) => ({
          ...current,
          notifications: current.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
        }));
      },
      markAllNotificationsRead() {
        setState((current) => ({
          ...current,
          notifications: current.notifications.map((item) => ({ ...item, read: true })),
        }));
      },
    };
  }, [classScope, ready, state]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
