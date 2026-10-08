"use client";

import { Button } from "@/components/ui/button";
import { Card, PageHeader, Tabs } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { Input, Select, Toggle } from "@/components/ui/inputs";
import { ConfirmDialog } from "@/components/ui/overlay";
import { TEACHER } from "@/lib/constants";
import { accountSchema, type AccountValues } from "@/lib/validation";
import { useData } from "@/providers/data-provider";
import { usePreferences } from "@/providers/preferences-provider";
import { useSession } from "@/providers/session-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function SettingsView() {
  const [tab, setTab] = useState("account");
  return (
    <div>
      <PageHeader title="Settings" subtitle="Account, classroom defaults, privacy and notification preferences." />
      <Tabs
        tabs={[
          { id: "account", label: "Account" },
          { id: "system", label: "System" },
          { id: "privacy", label: "Privacy" },
          { id: "notifications", label: "Notifications" },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="mt-6">
        {tab === "account" ? <AccountPanel /> : null}
        {tab === "system" ? <SystemPanel /> : null}
        {tab === "privacy" ? <PrivacyPanel /> : null}
        {tab === "notifications" ? <NotificationPanel /> : null}
      </div>
    </div>
  );
}

function AccountPanel() {
  const { user, updateUser } = useSession();
  const [preview, setPreview] = useState("");
  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: user?.name ?? TEACHER.name, email: user?.email ?? TEACHER.email },
  });
  return (
    <Card className="max-w-xl">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          updateUser({ name: values.name, email: values.email });
          toast.success("Account details updated");
        })}
      >
        <Field label="Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
        <Field label="Email" error={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></Field>
        <Field label="Role"><Input value={user?.role ?? TEACHER.role} readOnly /></Field>
        <p className="rounded-xl bg-soft px-3 py-3 text-sm leading-6 text-muted">Password management will become available when backend account services are connected.</p>
        <Field label="Profile picture">
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setPreview(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />
        </Field>
        {preview ? <img src={preview} alt="Profile preview" className="h-16 w-16 rounded-full object-cover" /> : null}
        <Button type="submit">Save account</Button>
      </form>
    </Card>
  );
}

function SystemPanel() {
  const { preferences, updatePreferences } = usePreferences();
  const { sections, setClassScope } = useData();
  return (
    <Card className="max-w-xl space-y-4">
      <Field label="Default class">
        <Select
          value={preferences.defaultClass}
          onChange={(event) => {
            updatePreferences({ defaultClass: event.target.value });
            setClassScope(event.target.value);
          }}
        >
          <option value="all">All classes</option>
          {sections.map((section) => (
            <option key={section} value={section}>{section}</option>
          ))}
        </Select>
      </Field>
      <Field label="Date format">
        <Select value={preferences.dateFormat} onChange={(event) => updatePreferences({ dateFormat: event.target.value as typeof preferences.dateFormat })}>
          <option value="dd MMM yyyy">06 Oct 2026</option>
          <option value="d MMM yyyy">6 Oct 2026</option>
          <option value="yyyy-MM-dd">2026-10-06</option>
        </Select>
      </Field>
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-heading">Interface density</legend>
        <div className="flex gap-2">
          {(["comfortable", "compact"] as const).map((density) => (
            <button key={density} type="button" onClick={() => updatePreferences({ density })} className={`h-11 rounded-[10px] border px-4 text-sm font-medium capitalize ${preferences.density === density ? "border-primary bg-primary-soft text-primary-dark" : "border-line"}`}>
              {density}
            </button>
          ))}
        </div>
      </fieldset>
    </Card>
  );
}

function PrivacyPanel() {
  const { students, deleteStudent, restoreDemo } = useData();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const student = students.find((item) => item.id === studentId);
  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <h2 className="text-base font-semibold text-heading">Data handling</h2>
        <p className="mt-2 text-sm leading-6 text-body">
          In this demonstration, student records stay in your browser. When the FastAPI service is connected, records are intended to be stored under an internal LearnGuard identifier, with access limited to authorised school staff. This demo does not claim encrypted storage.
        </p>
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-heading">Consent requirements</h2>
        <p className="mt-2 text-sm leading-6 text-body">A screening cannot start until guardian consent is marked verified on the student profile.</p>
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-heading">Data retention</h2>
        <p className="mt-2 text-sm leading-6 text-body">School policy should set how long screening records are kept. Deleting a student here removes that profile, its assessments, observations and reports from this browser.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Select aria-label="Student to delete" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            {students.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
          <Button variant="destructive" onClick={() => setOpen(true)} disabled={!student}>Delete student records</Button>
        </div>
        <Button variant="secondary" className="mt-3" onClick={() => setRestoreOpen(true)}>Restore demo records</Button>
      </Card>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete Student?"
        description="This will permanently remove the student’s stored screening records."
        confirmLabel="Delete Student"
        destructive
        onConfirm={() => {
          if (!student) return;
          deleteStudent(student.id);
          setOpen(false);
          toast.success("Student records removed");
        }}
      />
      <ConfirmDialog
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title="Restore demonstration data?"
        description="Students, assessments and reports added in this browser will be replaced by the original demonstration set."
        confirmLabel="Restore demo data"
        onConfirm={() => {
          restoreDemo();
          setRestoreOpen(false);
          toast.success("Demonstration records restored");
        }}
      />
    </div>
  );
}

function NotificationPanel() {
  const { preferences, updatePreferences } = usePreferences();
  const items = [
    ["elevated_result", "Elevated screening result", "When a new elevated or high result is saved"],
    ["pending_assessment", "Pending assessment reminders", "When a screening is still open"],
    ["report_generated", "Report generated", "When a screening summary is ready"],
    ["behaviour_logged", "Classroom observation saved", "When a teacher observation is saved"],
  ] as const;
  return (
    <Card className="max-w-xl divide-y divide-line">
      {items.map(([key, label, description]) => (
        <Toggle
          key={key}
          label={label}
          description={description}
          checked={preferences.notifications[key]}
          onChange={(checked) => updatePreferences({ notifications: { ...preferences.notifications, [key]: checked } })}
        />
      ))}
    </Card>
  );
}
