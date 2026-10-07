"use client";

import { ScreeningDisclaimer } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Breadcrumb, Card, PageHeader } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { Input, RadioGroup, Select, Textarea } from "@/components/ui/inputs";
import { GRADES, SCHOOL } from "@/lib/constants";
import { studentSchema, type StudentFormValues } from "@/lib/validation";
import { useData } from "@/providers/data-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function StudentForm() {
  const router = useRouter();
  const { createStudentRecord } = useData();
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      code: "",
      name: "",
      age: 9,
      grade: "4",
      school: SCHOOL,
      section: "",
      previousAssessment: "no",
      notes: "",
      consentVerified: false,
      consentDate: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const student = await createStudentRecord({
        ...values,
        previousAssessment: values.previousAssessment === "yes",
        notes: values.notes,
      });
      toast.success("Student created successfully");
      router.push(`/students/${student.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The student could not be saved.";
      form.setError("code", { message });
      toast.error(message);
    }
  });

  const errors = form.formState.errors;

  return (
    <div>
      <PageHeader
        title="Add Student"
        subtitle="Create a secure student profile for screening and progress tracking."
        breadcrumb={<Breadcrumb items={[{ label: "Students", href: "/students" }, { label: "Add Student" }]} />}
      />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Card>
          <h2 className="text-base font-semibold text-heading">Basic Information</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Student ID" htmlFor="code" error={errors.code?.message}>
              <Input id="code" placeholder="LG-2026-021" invalid={Boolean(errors.code)} {...form.register("code")} />
            </Field>
            <Field label="Student Name / Label" htmlFor="name" error={errors.name?.message}>
              <Input id="name" invalid={Boolean(errors.name)} {...form.register("name")} />
            </Field>
            <Field label="Age" htmlFor="age" error={errors.age?.message}>
              <Input id="age" type="number" min={5} max={18} invalid={Boolean(errors.age)} {...form.register("age")} />
            </Field>
            <Field label="Grade" htmlFor="grade" error={errors.grade?.message}>
              <Select id="grade" invalid={Boolean(errors.grade)} {...form.register("grade")}>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </Select>
            </Field>
            <Field label="School" htmlFor="school" error={errors.school?.message}>
              <Input id="school" invalid={Boolean(errors.school)} {...form.register("school")} />
            </Field>
            <Field label="Class / Section" htmlFor="section" error={errors.section?.message} hint="Example: 4-A">
              <Input id="section" invalid={Boolean(errors.section)} {...form.register("section")} />
            </Field>
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-heading">Screening Information</h2>
          <div className="mt-4 space-y-4">
            <RadioGroup
              label="Previous professional assessment?"
              name="previousAssessment"
              value={form.watch("previousAssessment")}
              onChange={(value) => form.setValue("previousAssessment", value, { shouldValidate: true })}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
            />
            {errors.previousAssessment ? <p className="text-xs text-risk-high">{errors.previousAssessment.message}</p> : null}
            <Field label="Relevant educational notes" htmlFor="notes" error={errors.notes?.message} hint="Optional. Describe classroom observations, not a diagnosis.">
              <Textarea id="notes" {...form.register("notes")} />
            </Field>
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-heading">Consent & Privacy</h2>
          <div className="mt-4 space-y-4">
            <label className="flex items-start gap-3 text-sm text-body">
              <input type="checkbox" className="mt-1 accent-primary" {...form.register("consentVerified")} />
              <span>Guardian consent verified</span>
            </label>
            {errors.consentVerified ? <p className="text-xs text-risk-high">{errors.consentVerified.message}</p> : null}
            <Field label="Consent date" htmlFor="consentDate" error={errors.consentDate?.message}>
              <Input id="consentDate" type="date" invalid={Boolean(errors.consentDate)} {...form.register("consentDate")} />
            </Field>
            <p className="text-sm leading-6 text-muted">Student records are stored under an internal LearnGuard identifier.</p>
          </div>
        </Card>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => router.push("/students")}>
            Cancel
          </Button>
          <Button type="submit" loading={form.formState.isSubmitting}>
            Save Student
          </Button>
        </div>
        <ScreeningDisclaimer />
      </form>
    </div>
  );
}
