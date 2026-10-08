"use client";

import { Button } from "@/components/ui/button";
import { Card, DataTable, EmptyState, PageHeader, SearchBox } from "@/components/ui/display";
import { Input, Select } from "@/components/ui/inputs";
import { RiskBadge } from "@/components/ui/risk";
import { useData } from "@/providers/data-provider";
import { useStudent } from "@/hooks/use-student";
import type { BehaviourObservation, RiskLevel } from "@/types";
import { Activity } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";

const BehaviourTrends = dynamic(
  () => import("@/components/monitoring/behaviour-charts").then((mod) => mod.BehaviourTrends),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-48 animate-pulse rounded-2xl bg-soft" />
        <div className="h-48 animate-pulse rounded-2xl bg-soft" />
        <div className="h-48 animate-pulse rounded-2xl bg-soft" />
      </div>
    ),
  },
);

export function BehaviourLogs() {
  const { observations, students } = useData();
  const [studentId, setStudentId] = useState("all");
  const [subject, setSubject] = useState("all");
  const [risk, setRisk] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const subjects = Array.from(new Set(observations.map((item) => item.subject)));
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return observations
      .filter((item) => {
        const student = students.find((entry) => entry.id === item.studentId);
        const matchesQuery = !term || `${student?.name ?? ""} ${item.subject}`.toLowerCase().includes(term);
        const matchesFrom = !from || item.date >= from;
        const matchesTo = !to || item.date <= to;
        return matchesQuery && matchesFrom && matchesTo && (studentId === "all" || item.studentId === studentId) && (subject === "all" || item.subject === subject) && (risk === "all" || item.riskLevel === risk);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [from, observations, query, risk, studentId, students, subject, to]);

  return (
    <div>
      <PageHeader
        title="Behaviour Logs"
        subtitle="Track repeated classroom observations over time."
        actions={<Link href="/assessment/new"><Button>Log Behaviour</Button></Link>}
      />
      <div className="mb-4 flex flex-col gap-2 md:flex-row">
        <div className="md:w-72"><SearchBox value={query} onChange={setQuery} placeholder="Search student or subject…" /></div>
        <Select aria-label="Student" value={studentId} onChange={(event) => setStudentId(event.target.value)} className="h-11 w-auto">
          <option value="all">All students</option>
          {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
        </Select>
        <Select aria-label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} className="h-11 w-auto">
          <option value="all">All subjects</option>
          {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select aria-label="Risk" value={risk} onChange={(event) => setRisk(event.target.value)} className="h-11 w-auto">
          <option value="all">All risk levels</option>
          {(["low", "moderate", "elevated", "high"] as RiskLevel[]).map((level) => <option key={level} value={level}>{level}</option>)}
        </Select>
        <Input aria-label="From date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-11 w-auto" />
        <Input aria-label="To date" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-11 w-auto" />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Activity className="h-5 w-5" />} title="No behaviour observations." description="Add a classroom observation to start building a behavioural record." action={<Link href="/assessment/new"><Button>Log Behaviour</Button></Link>} />
      ) : (
        <DataTable
          caption="Behaviour logs"
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: "date", header: "Date", cell: (row: BehaviourObservation) => row.date },
            { key: "student", header: "Student", cell: (row) => students.find((student) => student.id === row.studentId)?.name ?? "Student" },
            { key: "subject", header: "Subject", cell: (row) => row.subject },
            { key: "duration", header: "Duration", cell: (row) => `${row.durationMin} min` },
            { key: "off", header: "Off-task events", cell: (row) => row.offTaskEvents },
            { key: "attention", header: "Attention duration", cell: (row) => `${row.sustainedAttentionMin} min` },
            { key: "status", header: "Status", cell: (row) => <RiskBadge level={row.riskLevel} /> },
            { key: "action", header: "Action", cell: (row) => <Link href={`/behaviour/${row.studentId}`}><Button size="sm" variant="secondary">Open</Button></Link> },
          ]}
        />
      )}
    </div>
  );
}

export function StudentBehaviour({ studentId }: { studentId: string }) {
  const { student, observations } = useStudent(studentId);
  if (!student) return <EmptyState icon={<Activity className="h-5 w-5" />} title="Student not found." description="Return to the behaviour log and choose another record." />;
  const ordered = [...observations].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div>
      <PageHeader
        title={`${student.name}`}
        subtitle="Observation history for attention, off-task events and task completion."
        actions={<Link href={`/assessment/adhd/${student.id}`}><Button>Add observation</Button></Link>}
      />
      <BehaviourTrends
        attention={ordered.map((item) => ({ label: item.date.slice(5), value: item.sustainedAttentionMin }))}
        offTask={ordered.map((item) => ({ label: item.date.slice(5), value: item.offTaskEvents }))}
        completion={ordered.map((item) => ({ label: item.date.slice(5), value: item.taskCompletionPct }))}
      />
      <div className="mt-4 space-y-3">
        {[...observations].sort((a, b) => b.date.localeCompare(a.date)).map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-heading">{item.date} · {item.subject}</p>
                <p className="text-xs text-muted">{item.durationMin} min · {item.environment}</p>
              </div>
              <RiskBadge level={item.riskLevel} />
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div><dt className="text-muted">Attention</dt><dd>{item.sustainedAttentionMin} min</dd></div>
              <div><dt className="text-muted">Off-task</dt><dd>{item.offTaskEvents}</dd></div>
              <div><dt className="text-muted">Task completion</dt><dd>{item.taskCompletionPct}%</dd></div>
            </dl>
            {item.notes ? <p className="mt-3 text-sm leading-6 text-body">{item.notes}</p> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

