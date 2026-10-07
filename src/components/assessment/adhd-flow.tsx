"use client";

import { ConsentRequired, StudentSummary, useUnsavedWarning } from "@/components/assessment/shared";
import { ScreeningDisclaimer } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Breadcrumb, Card, ErrorState, PageHeader } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { CounterInput, Input, RadioGroup, Select, Textarea } from "@/components/ui/inputs";
import { ConfirmDialog } from "@/components/ui/overlay";
import { scoreObservation } from "@/lib/behaviour-score";
import { CONSISTENCY_OPTIONS, FREQUENCY_OPTIONS, RESPONSE_OPTIONS, TEACHER } from "@/lib/constants";
import { behaviourSchema, type BehaviourValues } from "@/lib/validation";
import { useStudent } from "@/hooks/use-student";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export function AdhdFlow({ studentId }: { studentId: string }) {
  const { student, saveObservation, runAssessment } = useStudent(studentId);
  const router = useRouter();
  const [savedLabel, setSavedLabel] = useState("Draft not saved yet");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const form = useForm<BehaviourValues>({
    resolver: zodResolver(behaviourSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      subject: "Mathematics",
      durationMin: 30,
      environment: student ? `Classroom ${student.section}` : "",
      sustainedAttentionMin: 12,
      offTaskEvents: 4,
      instructionsRepeated: 1,
      responseToInstructions: "minor_delay",
      taskCompletionPct: 70,
      taskCompletionTimeMin: 25,
      taskAbandonment: "sometimes",
      consistency: 3,
      seatLeaving: 1,
      interruptions: 1,
      restlessness: 2,
      impulsiveResponses: 1,
      notes: "",
    },
  });

  const draftSnapshot = JSON.stringify(form.watch());
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`learnguard-obs-${studentId}`, draftSnapshot);
      setSavedLabel("Saved automatically");
    }, 700);
    return () => clearTimeout(timer);
  }, [draftSnapshot, studentId]);

  useEffect(() => {
    const saved = localStorage.getItem(`learnguard-obs-${studentId}`);
    if (saved) {
      try {
        form.reset({ ...form.getValues(), ...JSON.parse(saved) });
        setSavedLabel("Saved automatically");
      } catch {
        setSavedLabel("Draft not saved yet");
      }
    }
    // Load a stored draft once when the form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useUnsavedWarning(form.formState.isDirty);

  if (!student) {
    return <ErrorState title="Student not found" description="Open behaviour logs and choose a student." action={<Link href="/behaviour"><Button>Behaviour logs</Button></Link>} />;
  }

  if (!student.consentVerified) return <ConsentRequired name={student.name} />;

  const onSubmit = form.handleSubmit(async (values) => {
    if (values.sustainedAttentionMin > values.durationMin) {
      form.setError("sustainedAttentionMin", { message: "Attention time cannot exceed the session length" });
      return;
    }
    const draft = {
      studentId: student.id,
      date: values.date,
      subject: values.subject,
      durationMin: values.durationMin,
      environment: values.environment,
      teacher: TEACHER.name,
      sustainedAttentionMin: values.sustainedAttentionMin,
      offTaskEvents: values.offTaskEvents,
      instructionsRepeated: values.instructionsRepeated,
      responseToInstructions: values.responseToInstructions,
      taskCompletionPct: values.taskCompletionPct,
      taskCompletionTimeMin: values.taskCompletionTimeMin,
      taskAbandonment: values.taskAbandonment,
      consistency: values.consistency as 1 | 2 | 3 | 4 | 5,
      seatLeaving: values.seatLeaving,
      interruptions: values.interruptions,
      restlessness: values.restlessness,
      impulsiveResponses: values.impulsiveResponses,
      notes: values.notes,
    };
    const scored = scoreObservation(draft);
    try {
    await saveObservation(draft);
    const assessment = await runAssessment({ studentId: student.id, type: "adhd", inputQuality: "Good", score: scored.score });
      localStorage.removeItem(`learnguard-obs-${studentId}`);
      toast.success("Observation saved successfully.");
      router.push(`/results/${assessment.id}`);
    } catch {
      toast.error("We couldn’t save this observation. Your notes are still in the form.");
    }
  });

  const errors = form.formState.errors;

  return (
    <div>
      <PageHeader
        title="ADHD-Related Screening"
        subtitle="A structured classroom observation. Describe what you saw."
        breadcrumb={<Breadcrumb items={[{ label: "Behaviour", href: "/behaviour" }, { label: student.name }]} />}
        actions={<span className="text-xs text-faint">{savedLabel}</span>}
      />
      <StudentSummary name={student.name} code={student.code} grade={student.grade} />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Card>
          <h2 className="text-base font-semibold text-heading">Observation Session</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Date" htmlFor="date" error={errors.date?.message}><Input id="date" type="date" {...form.register("date")} /></Field>
            <Field label="Subject / Task" htmlFor="subject" error={errors.subject?.message}><Input id="subject" {...form.register("subject")} /></Field>
            <Field label="Observation Duration (minutes)" htmlFor="duration" error={errors.durationMin?.message}><Input id="duration" type="number" {...form.register("durationMin")} /></Field>
            <Field label="Class / Environment" htmlFor="environment" error={errors.environment?.message}><Input id="environment" {...form.register("environment")} /></Field>
            <Field label="Teacher"><Input value={TEACHER.name} readOnly /></Field>
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-heading">Attention</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Controller control={form.control} name="sustainedAttentionMin" render={({ field }) => <CounterInput label="Estimated sustained attention (minutes)" value={Number(field.value)} max={90} onChange={field.onChange} />} />
            <Controller control={form.control} name="offTaskEvents" render={({ field }) => <CounterInput label="Off-task events" value={Number(field.value)} onChange={field.onChange} />} />
            <Controller control={form.control} name="instructionsRepeated" render={({ field }) => <CounterInput label="Instructions repeated" value={Number(field.value)} max={20} onChange={field.onChange} />} />
            <Field label="Response to instructions" error={errors.responseToInstructions?.message}>
              <Select {...form.register("responseToInstructions")}>
                {RESPONSE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Field>
          </div>
          {errors.sustainedAttentionMin ? <p className="mt-2 text-xs text-risk-high">{errors.sustainedAttentionMin.message}</p> : null}
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-heading">Task Behaviour</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Task completion %" error={errors.taskCompletionPct?.message}><Input type="number" min={0} max={100} {...form.register("taskCompletionPct")} /></Field>
            <Field label="Task completion time (minutes)"><Input type="number" {...form.register("taskCompletionTimeMin")} /></Field>
          </div>
          <div className="mt-4">
            <Controller
              control={form.control}
              name="taskAbandonment"
              render={({ field }) => (
                <RadioGroup label="Task abandonment" name="abandon" value={field.value} onChange={field.onChange} options={FREQUENCY_OPTIONS.map((item) => ({ value: item.value, label: item.label }))} />
              )}
            />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-[13px] font-medium text-heading">Consistency</p>
            <div className="flex flex-wrap gap-2">
              {CONSISTENCY_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => form.setValue("consistency", option.value)} className={`h-10 rounded-full border px-3 text-sm ${Number(form.watch("consistency")) === option.value ? "border-primary bg-primary-soft text-primary-dark" : "border-line"}`}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-heading">Classroom Behaviour</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Controller control={form.control} name="seatLeaving" render={({ field }) => <CounterInput label="Seat-leaving events" value={Number(field.value)} onChange={field.onChange} />} />
            <Controller control={form.control} name="interruptions" render={({ field }) => <CounterInput label="Interruptions" value={Number(field.value)} onChange={field.onChange} />} />
            <Controller control={form.control} name="restlessness" render={({ field }) => <CounterInput label="Restlessness (1–5)" value={Number(field.value)} min={1} max={5} onChange={field.onChange} />} />
            <Controller control={form.control} name="impulsiveResponses" render={({ field }) => <CounterInput label="Impulsive responses" value={Number(field.value)} onChange={field.onChange} />} />
          </div>
        </Card>
        <Card>
          <Field label="Teacher notes" hint="Use observations rather than diagnostic language.">
            <Textarea {...form.register("notes")} />
          </Field>
          {errors.notes ? <p className="mt-2 text-xs text-risk-high">{errors.notes.message}</p> : null}
        </Card>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => (form.formState.isDirty ? setLeaveOpen(true) : router.push(`/students/${student.id}/behaviour`))}>Cancel</Button>
          <Button type="submit" loading={form.formState.isSubmitting}>Save Observation</Button>
        </div>
        <ScreeningDisclaimer />
      </form>
      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave this observation?"
        description="Notes saved in this browser draft can be restored, but the observation will not be submitted."
        confirmLabel="Leave"
        onConfirm={() => router.push(`/students/${student.id}/behaviour`)}
      />
    </div>
  );
}
