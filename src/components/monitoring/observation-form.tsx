"use client";

import { ConsentRequired, StudentSummary, useUnsavedWarning } from "@/components/assessment/shared";
import { Button } from "@/components/ui/button";
import { Breadcrumb, Card, ErrorState, PageHeader } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { CounterInput, Input, RadioGroup, Select, Textarea } from "@/components/ui/inputs";
import { ConfirmDialog } from "@/components/ui/overlay";
import { CONSISTENCY_OPTIONS, FREQUENCY_OPTIONS, RESPONSE_OPTIONS, TEACHER } from "@/lib/constants";
import { behaviourSchema, type BehaviourValues } from "@/lib/validation";
import { useStudent } from "@/hooks/use-student";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export function ObservationForm({ studentId }: { studentId: string }) {
  const { student, saveObservation } = useStudent(studentId);
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
    if (!saved) return;
    try {
      form.reset({ ...form.getValues(), ...JSON.parse(saved) });
      setSavedLabel("Saved automatically");
    } catch {
      setSavedLabel("Draft not saved yet");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useUnsavedWarning(form.formState.isDirty);

  if (!student) {
    return <ErrorState title="Student not found" description="Open classroom observations and choose a student." action={<Link href="/behaviour"><Button>Classroom observations</Button></Link>} />;
  }
  if (!student.consentVerified) return <ConsentRequired name={student.name} />;

  const onSubmit = form.handleSubmit(async (values) => {
    if (values.sustainedAttentionMin > values.durationMin) {
      form.setError("sustainedAttentionMin", { message: "Attention time cannot exceed the session length" });
      return;
    }
    try {
      await saveObservation({
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
      });
      localStorage.removeItem(`learnguard-obs-${studentId}`);
      toast.success("Observation saved. This note is not sent to the ADHD screening model.");
      router.push(`/behaviour/${student.id}`);
    } catch {
      toast.error("We couldn’t save this observation. Your notes are still in the form.");
    }
  });

  const errors = form.formState.errors;

  return (
    <div>
      <PageHeader
        title="Classroom Observation"
        subtitle="Teacher-recorded notes for longitudinal support. These observations are not direct inputs to the current ADHD caregiver model."
        breadcrumb={<Breadcrumb items={[{ label: "Classroom Observations", href: "/behaviour" }, { label: student.name }]} />}
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
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-heading">Task Behaviour</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Task completion %" error={errors.taskCompletionPct?.message}><Input type="number" min={0} max={100} {...form.register("taskCompletionPct")} /></Field>
            <Field label="Task completion time (minutes)"><Input type="number" {...form.register("taskCompletionTimeMin")} /></Field>
          </div>
          <div className="mt-4">
            <Controller control={form.control} name="taskAbandonment" render={({ field }) => <RadioGroup label="Task abandonment" name="abandon" value={field.value} onChange={field.onChange} options={FREQUENCY_OPTIONS.map((item) => ({ value: item.value, label: item.label }))} />} />
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
          <h2 className="text-base font-semibold text-heading">Movement and interruptions</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Controller control={form.control} name="seatLeaving" render={({ field }) => <CounterInput label="Seat-leaving events" value={Number(field.value)} onChange={field.onChange} />} />
            <Controller control={form.control} name="interruptions" render={({ field }) => <CounterInput label="Interruptions" value={Number(field.value)} onChange={field.onChange} />} />
            <Controller control={form.control} name="restlessness" render={({ field }) => <CounterInput label="Restlessness (1–5)" value={Number(field.value)} min={1} max={5} onChange={field.onChange} />} />
            <Controller control={form.control} name="impulsiveResponses" render={({ field }) => <CounterInput label="Impulsive responses" value={Number(field.value)} onChange={field.onChange} />} />
          </div>
        </Card>
        <Card>
          <Field label="Teacher notes" hint="Describe what you saw. These notes do not diagnose and are not model features.">
            <Textarea {...form.register("notes")} />
          </Field>
        </Card>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => (form.formState.isDirty ? setLeaveOpen(true) : router.push(`/behaviour/${student.id}`))}>Cancel</Button>
          <Button type="submit" loading={form.formState.isSubmitting}>Save Observation</Button>
        </div>
      </form>
      <ConfirmDialog open={leaveOpen} onClose={() => setLeaveOpen(false)} title="Leave this observation?" description="A draft stays in this browser, but the observation will not be submitted." confirmLabel="Leave" onConfirm={() => router.push(`/behaviour/${student.id}`)} />
    </div>
  );
}
