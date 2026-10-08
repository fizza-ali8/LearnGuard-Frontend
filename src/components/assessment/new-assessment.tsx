"use client";

import { Button } from "@/components/ui/button";
import { Card, PageHeader, SearchBox } from "@/components/ui/display";
import { AssessmentStepper } from "@/components/assessment/shared";
import { screeningStatus, statusLabel } from "@/lib/risk";
import { useData } from "@/providers/data-provider";
import { isAdhdEligible } from "@/data/adhd-questionnaire";
import { BookOpen, ClipboardList, Mic } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Suspense } from "react";

function Wizard() {
  const { students } = useData();
  const params = useSearchParams();
  const router = useRouter();
  const preset = params.get("student");
  const [step, setStep] = useState(preset ? 1 : 0);
  const [studentId, setStudentId] = useState(preset ?? "");
  const [query, setQuery] = useState("");
  const student = students.find((item) => item.id === studentId);
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    return students.filter((item) => !term || `${item.name} ${item.code}`.toLowerCase().includes(term));
  }, [query, students]);

  return (
    <div>
      <PageHeader title="New Assessment" subtitle="Choose a student and a screening module. Each module stays on its own guided path." />
      <AssessmentStepper steps={["Select Student", "Screening Type", "Input", "Review", "Analyze", "Result"]} current={step} />
      {step === 0 ? (
        <Card>
          <SearchBox value={query} onChange={setQuery} placeholder="Search by name or student ID…" />
          <ul className="mt-4 max-h-[420px] divide-y divide-line overflow-auto">
            {matches.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setStudentId(item.id)}
                  className={`flex w-full items-center justify-between px-2 py-3 text-left ${studentId === item.id ? "bg-primary-softer" : "hover:bg-soft"}`}
                >
                  <span>
                    <span className="block text-sm font-medium text-heading">{item.name}</span>
                    <span className="text-xs text-faint">Grade {item.grade} · {item.code}</span>
                  </span>
                  <span className="text-xs text-muted">{statusLabel(screeningStatus(item))}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Button disabled={!student} onClick={() => setStep(1)}>Continue</Button>
          </div>
        </Card>
      ) : (
        <div>
          <p className="mb-4 text-sm text-muted">
            Screening for <span className="font-medium text-heading">{student?.name}</span>
            {!student?.consentVerified ? " · Consent is still pending. Confirm it before collecting a sample." : ""}
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            <ModuleCard
              icon={<Mic className="h-5 w-5" />}
              title="Dyslexia Screening"
              input="Oral reading + language"
              body="Evaluate reading fluency, omissions, timing and linguistic patterns."
              time="5–8 min"
              action="Start Dyslexia Screening"
              disabled={!student?.consentVerified}
              onClick={() => router.push(`/assessment/dyslexia/${studentId}`)}
            />
            <ModuleCard
              icon={<BookOpen className="h-5 w-5" />}
              title="Dysgraphia Screening"
              input="Handwriting sample"
              body="Evaluate visual handwriting patterns and spacing consistency."
              time="2–4 min"
              action="Start Dysgraphia Screening"
              disabled={!student?.consentVerified}
              onClick={() => router.push(`/assessment/dysgraphia/${studentId}`)}
            />
            <ModuleCard
              icon={<ClipboardList className="h-5 w-5" />}
              title="ADHD-Related Caregiver Screening"
              input="Caregiver questionnaire"
              body="A 20-item caregiver questionnaire covering attention, school functioning, social behaviour, sleep and activities."
              time="5–7 min"
              note={student && !isAdhdEligible(student.age) ? "Current model supports children aged 6–11." : "For ages 6–11"}
              action="Start Questionnaire"
              disabled={!student?.consentVerified || !student || !isAdhdEligible(student.age)}
              onClick={() => router.push(`/assessment/adhd/${studentId}`)}
            />
          </div>
          <Button variant="tertiary" className="mt-4" onClick={() => setStep(0)}>Choose a different student</Button>
        </div>
      )}
    </div>
  );
}

function ModuleCard({
  icon,
  title,
  input,
  body,
  time,
  note,
  action,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  input: string;
  body: string;
  time: string;
  note?: string;
  action: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Card className="flex flex-col">
      <div className="text-primary-dark">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold text-heading">{title}</h2>
      <p className="mt-1 text-sm font-medium text-primary-dark">{input}</p>
      <p className="mt-3 flex-1 text-sm leading-6 text-muted">{body}</p>
      <p className="mt-4 text-xs text-faint">Estimated time: {time}</p>
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
      <Button className="mt-4" onClick={onClick} disabled={disabled}>{action}</Button>
    </Card>
  );
}

export function NewAssessment() {
  return (
    <Suspense>
      <Wizard />
    </Suspense>
  );
}
