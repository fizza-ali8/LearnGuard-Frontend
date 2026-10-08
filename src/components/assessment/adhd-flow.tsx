"use client";

import { AnalysisScreen, ConsentRequired, StudentSummary } from "@/components/assessment/shared";
import { ScreeningDisclaimer } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Breadcrumb, Card, ErrorState, PageHeader } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/overlay";
import {
  ADHD_RESPONDENTS,
  adhdDraftKey,
  answerLabel,
  answeredCount,
  firstUnanswered,
  ADHD_SCREENING_DISCLAIMER,
  isAdhdEligible,
  questionsInSection,
  sectionsFor,
  type AdhdAnswers,
  type AdhdQuestion,
  type AdhdRespondent,
} from "@/data/adhd-questionnaire";
import { useStudent } from "@/hooks/use-student";
import { getAdhdQuestions } from "@/services/adhd";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Phase = "intro" | "questions" | "review" | "analyze";

export function AdhdFlow({ studentId }: { studentId: string }) {
  const { student, submitAdhdScreening } = useStudent(studentId);
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<AdhdAnswers>({});
  const [respondent, setRespondent] = useState<AdhdRespondent | "">("");
  const [savedLabel, setSavedLabel] = useState("Draft not saved yet");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const loaded = useRef(false);
  const saving = useRef(false);
  const [questions, setQuestions] = useState<AdhdQuestion[] | null>(null);
  const sections = useMemo(() => (questions ? sectionsFor(questions) : []), [questions]);
  const completed = questions ? answeredCount(answers, questions) : 0;
  const section = sections[sectionIndex] ?? sections[0] ?? "";
  const sectionQuestions = useMemo(() => (questions ? questionsInSection(section, questions) : []), [questions, section]);

  useEffect(() => {
    let cancelled = false;
    getAdhdQuestions().then((list) => {
      if (!cancelled) setQuestions(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!student || !questions || loaded.current) return;
    loaded.current = true;
    const ageQuestion = questions.find((question) => question.featureKey === "sc_age_years");
    const saved = localStorage.getItem(adhdDraftKey(student.id));
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { answers?: AdhdAnswers; respondent?: AdhdRespondent };
        const next: AdhdAnswers = {};
        questions.forEach((question) => {
          const value = parsed.answers?.[question.featureKey];
          if (typeof value === "number" && question.options.some((option) => option.value === value)) next[question.featureKey] = value;
        });
        if (ageQuestion?.options.some((option) => option.value === student.age)) next.sc_age_years = student.age;
        setAnswers(next);
        if (parsed.respondent) {
          setRespondent(parsed.respondent);
          const pending = firstUnanswered(next, questions);
          if (!pending) setPhase("review");
          else {
            setSectionIndex(Math.max(sectionsFor(questions).indexOf(pending.section), 0));
            setPhase("questions");
          }
        }
        setSavedLabel("Saved automatically");
        return;
      } catch {
        setSavedLabel("Draft not saved yet");
      }
    }
    if (ageQuestion?.options.some((option) => option.value === student.age)) setAnswers({ sc_age_years: student.age });
  }, [questions, student]);

  useEffect(() => {
    if (!loaded.current) return;
    if (phase === "intro" && !respondent) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(adhdDraftKey(studentId), JSON.stringify({ answers, respondent }));
      setSavedLabel("Saved automatically");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [answers, phase, respondent, studentId]);

  if (!student) {
    return <ErrorState title="Student not found" description="Choose a student from the assessment list." action={<Link href="/assessment/new"><Button>Choose student</Button></Link>} />;
  }
  if (!student.consentVerified) return <ConsentRequired name={student.name} />;
  if (!isAdhdEligible(student.age)) {
    return (
      <Card className="max-w-xl">
        <h2 className="text-lg font-semibold text-heading">This student is outside the supported age range</h2>
        <p className="mt-2 text-sm leading-6 text-muted">The current ADHD-related screening model is designed for children aged 6–11.</p>
        <Link href={`/students/${student.id}`} className="mt-5 inline-flex"><Button>Return to Student</Button></Link>
      </Card>
    );
  }
  if (!questions) {
    return <Card className="max-w-xl"><p className="text-sm text-muted">Loading the caregiver questionnaire…</p></Card>;
  }

  const sectionComplete = sectionQuestions.every((question) => typeof answers[question.featureKey] === "number");
  const missing = questions.length - completed;
  const choose = (question: AdhdQuestion, value: number) => {
    if (question.featureKey === "sc_age_years") return;
    setAnswers((current) => ({ ...current, [question.featureKey]: value }));
  };

  const openMissing = () => {
    const question = firstUnanswered(answers, questions);
    if (!question) return;
    const index = sections.indexOf(question.section);
    setSectionIndex(Math.max(index, 0));
    setPhase("questions");
    window.setTimeout(() => document.getElementById(`question-${question.featureKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const submit = async () => {
    if (saving.current || !respondent || completed !== questions.length) return;
    if (answers.sc_age_years !== student.age) {
      const message = "The questionnaire age must match the student profile. Update the student record if the age is wrong.";
      setAnalysisError(message);
      toast.error(message);
      return;
    }
    saving.current = true;
    setAnalysisError(null);
    try {
      const assessment = await submitAdhdScreening({ studentId: student.id, respondent, answers }, questions);
      localStorage.removeItem(adhdDraftKey(student.id));
      toast.success("Questionnaire submitted");
      router.push(`/results/${assessment.id}`);
    } catch (error) {
      saving.current = false;
      const message = error instanceof Error ? error.message : "The questionnaire could not be analyzed. Your answers are still saved.";
      setAnalysisError(message);
      toast.error(message);
    }
  };

  return (
    <div>
      <PageHeader
        title="ADHD-Related Caregiver Screening"
        subtitle="A caregiver-reported questionnaire used to support early ADHD-related screening."
        breadcrumb={<Breadcrumb items={[{ label: "Students", href: "/students" }, { label: student.name, href: `/students/${student.id}` }, { label: "ADHD Caregiver Questionnaire" }]} />}
        actions={<span className="text-xs text-faint">{savedLabel} · {completed} of {questions.length} answered</span>}
      />
      <StudentSummary name={student.name} code={student.code} grade={student.grade} />

      {phase === "intro" ? (
        <Card className="max-w-2xl">
          <p className="text-sm font-medium text-primary-dark">ADHD Caregiver Questionnaire</p>
          <h2 className="mt-2 text-xl font-semibold text-heading">Who should complete this questionnaire?</h2>
          <p className="mt-2 text-sm leading-6 text-body">This questionnaire should be completed by a parent or adult caregiver who is familiar with the child&apos;s usual behaviour.</p>
          <p className="mt-3 text-sm leading-6 text-muted">It asks about the child&apos;s attention, school experience, social behaviour, sleep, daily routine and activities.</p>
          <ul className="mt-4 space-y-1 text-sm text-body">
            <li>20 questions</li>
            <li>About 5–7 minutes</li>
            <li>All questions required</li>
            <li>For children aged 6–11</li>
          </ul>
          <p className="mt-4 text-sm font-medium text-heading">Completed by</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {ADHD_RESPONDENTS.map((item) => (
              <button key={item.value} type="button" onClick={() => setRespondent(item.value)} className={cn("h-11 rounded-[10px] border px-3 text-sm", respondent === item.value ? "border-primary bg-primary-soft text-primary-dark" : "border-line bg-surface text-body")}>
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-primary-softer px-3 py-3 text-sm leading-6 text-body">{ADHD_SCREENING_DISCLAIMER}</p>
          <p className="mt-3 text-xs leading-5 text-faint">Responses are used only for LearnGuard screening and research functions according to the project&apos;s data-handling policy.</p>
          <Button className="mt-5" disabled={!respondent} onClick={() => setPhase("questions")}>Begin Questionnaire</Button>
        </Card>
      ) : null}

      {phase === "questions" ? (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <nav className="hidden lg:block" aria-label="Questionnaire sections">
            <ol className="space-y-1">
              {sections.map((item, index) => {
                const done = questionsInSection(item, questions).every((question) => typeof answers[question.featureKey] === "number");
                return (
                  <li key={item}>
                    <button type="button" onClick={() => setSectionIndex(index)} className={cn("flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-sm", index === sectionIndex ? "bg-primary-soft font-medium text-primary-dark" : "text-body hover:bg-soft")}>
                      <span>{item}</span>
                      <span className="text-xs">{done ? "✓" : index === sectionIndex ? "●" : ""}</span>
                    </button>
                  </li>
                );
              })}
              <li><button type="button" onClick={() => setPhase("review")} className="w-full rounded-[10px] px-3 py-2 text-left text-sm text-body hover:bg-soft">Review</button></li>
            </ol>
          </nav>
          <div>
            <div className="mb-3 flex gap-2 overflow-x-auto lg:hidden" aria-label="Questionnaire sections">
              {sections.map((item, index) => (
                <button key={item} type="button" onClick={() => setSectionIndex(index)} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs", index === sectionIndex ? "border-primary bg-primary-soft text-primary-dark" : "border-line text-body")}>
                  {index + 1}. {item}
                </button>
              ))}
              <button type="button" onClick={() => setPhase("review")} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs text-body">Review</button>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-primary-dark">Step {sectionIndex + 1} of {sections.length + 1} · {section}</p>
              <p className="mt-1 text-sm text-muted">{completed} of {questions.length} questions completed</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-primary" style={{ width: `${(completed / questions.length) * 100}%` }} /></div>
            </div>
            <div className="space-y-4">
              {sectionQuestions.map((question) => (
                <div key={question.featureKey} id={`question-${question.featureKey}`}>
                <Card>
                  <p className="text-xs font-medium text-primary-dark">{question.section}</p>
                  <h2 className="mt-2 text-lg font-semibold text-heading">Question {question.number} of {questions.length}</h2>
                  <p className="mt-2 text-base leading-7 text-heading">{question.question}</p>
                  {question.helpText ? <p className="mt-2 text-sm leading-6 text-muted">Helpful note: {question.helpText}</p> : null}
                  {question.featureKey === "sc_age_years" ? (
                    <p className="mt-2 text-sm leading-6 text-muted">Age is taken from the student profile ({student.age} years) so the questionnaire matches the record. Update the student if that age is wrong.</p>
                  ) : null}
                  <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={question.question}>
                    {question.options.map((option) => {
                      const selected = answers[question.featureKey] === option.value;
                      const locked = question.featureKey === "sc_age_years";
                      return (
                        <button key={option.value} type="button" role="radio" aria-checked={selected} disabled={locked} onClick={() => choose(question, option.value)} className={cn("min-h-11 rounded-[10px] border px-3 text-left text-sm", selected ? "border-primary bg-primary-soft text-primary-dark" : "border-line bg-surface text-body hover:bg-primary-softer", locked && selected && "cursor-default disabled:opacity-100", locked && !selected && "cursor-not-allowed opacity-50 disabled:opacity-50")}>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </Card>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">Please answer based on the child&apos;s usual behaviour or the time period stated. Select one response for every question. If you are genuinely unsure about an answer, do not guess. The current model requires a response for every item, so you may need to confirm the information before submitting. A draft is saved in this browser.</p>
            <div className="mt-4 flex justify-between gap-2">
              <Button variant="secondary" onClick={() => (sectionIndex === 0 ? setPhase("intro") : setSectionIndex((value) => value - 1))}>Back</Button>
              <Button disabled={!sectionComplete} onClick={() => (sectionIndex === sections.length - 1 ? setPhase("review") : setSectionIndex((value) => value + 1))}>Continue</Button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "review" ? (
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-heading">Review your responses</h2>
          <p className="mt-1 text-sm text-muted">{completed} / {questions.length} questions answered {completed === questions.length ? "✓" : ""}</p>
          {missing > 0 ? (
            <Card className="mt-4">
              <p className="text-sm font-medium text-heading">{missing} {missing === 1 ? "question still needs" : "questions still need"} an answer</p>
              <p className="mt-1 text-sm text-muted">Please complete all required questions before submitting.</p>
              <Button className="mt-3" variant="secondary" onClick={openMissing}>Review incomplete questions</Button>
            </Card>
          ) : null}
          <div className="mt-4 space-y-4">
            {sections.map((item) => (
              <Card key={item}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-heading">{item}</h3>
                  <Button size="sm" variant="tertiary" onClick={() => { setSectionIndex(sections.indexOf(item)); setPhase("questions"); }}>Edit</Button>
                </div>
                <dl className="mt-3 space-y-2">
                  {questionsInSection(item, questions).map((question) => (
                    <div key={question.featureKey} className="grid gap-1 text-sm sm:grid-cols-[1fr_auto]">
                      <dt className="text-muted">{question.question}</dt>
                      <dd className="font-medium text-heading">{answerLabel(question, answers[question.featureKey]) || "Not answered"}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">Completed by {ADHD_RESPONDENTS.find((item) => item.value === respondent)?.label ?? "a caregiver"}.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPhase("questions")}>Back</Button>
            <Button disabled={completed !== questions.length || !respondent} onClick={() => setConfirmOpen(true)}>Submit for Screening</Button>
          </div>
        </div>
      ) : null}

      {phase === "analyze" && analysisError ? (
        <ErrorState title="We couldn’t complete this screening." description={analysisError} action={<Button onClick={() => { saving.current = false; setAnalysisError(null); setPhase("review"); }}>Back to review</Button>} />
      ) : null}
      {phase === "analyze" && !analysisError ? (
        <div>
          <p className="text-center text-sm font-medium text-heading">Questionnaire complete</p>
          <p className="mb-4 text-center text-sm text-muted">{questions.length} / {questions.length} answers recorded</p>
          <AnalysisScreen
            title="Analyzing responses"
            steps={["Preparing questionnaire", "Validating responses", "Running ADHD-related screening model", "Preparing result"]}
            onDone={submit}
          />
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit questionnaire?"
        description="Please confirm that the responses reflect the caregiver's knowledge of the child. Once submitted, the questionnaire will be analyzed by the ADHD-related screening model."
        confirmLabel="Submit Questionnaire"
        onConfirm={() => {
          setConfirmOpen(false);
          setPhase("analyze");
        }}
      />
      <ScreeningDisclaimer className="mt-6" />
    </div>
  );
}
