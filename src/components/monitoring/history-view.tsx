"use client";

import { Button } from "@/components/ui/button";
import { DataTable, EmptyState, PageHeader, Pagination, SearchBox } from "@/components/ui/display";
import { Input, Select } from "@/components/ui/inputs";
import { RiskBadge } from "@/components/ui/risk";
import { formatDate } from "@/lib/format";
import { adhdScreenStatus } from "@/data/adhd-questionnaire";
import { moduleFullLabel, riskLabel } from "@/lib/risk";
import { usePreferences } from "@/providers/preferences-provider";
import { useData } from "@/providers/data-provider";
import type { Assessment, AssessmentType, RiskLevel } from "@/types";
import { History } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function HistoryView() {
  const { assessments, students } = useData();
  const { preferences } = usePreferences();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [risk, setRisk] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return assessments
      .filter((item) => {
        const student = students.find((entry) => entry.id === item.studentId);
        const matchesName = !term || `${student?.name ?? ""} ${student?.code ?? ""}`.toLowerCase().includes(term);
        const day = item.createdAt.slice(0, 10);
        const matchesFrom = !from || day >= from;
        const matchesTo = !to || day <= to;
        return matchesName && matchesFrom && matchesTo && (type === "all" || item.type === type) && (risk === "all" || item.riskLevel === risk);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [assessments, from, query, risk, students, to, type]);

  const pages = Math.max(1, Math.ceil(rows.length / 8));
  const visible = rows.slice((page - 1) * 8, page * 8);

  return (
    <div>
      <PageHeader title="Assessment History" subtitle="Review completed screenings, scores and the teacher who recorded them." />
      <div className="mb-4 flex flex-col gap-2 md:flex-row">
        <div className="md:w-80">
          <SearchBox value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Search by student…" />
        </div>
        <Select aria-label="Assessment type" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="h-11 w-auto">
          <option value="all">All types</option>
          <option value="dyslexia">Dyslexia</option>
          <option value="dysgraphia">Dysgraphia</option>
          <option value="adhd">ADHD Caregiver Screening</option>
        </Select>
        <Select aria-label="Risk" value={risk} onChange={(event) => { setRisk(event.target.value); setPage(1); }} className="h-11 w-auto">
          <option value="all">All risk levels</option>
          {(["low", "moderate", "elevated", "high"] as RiskLevel[]).map((level) => (
            <option key={level} value={level}>{riskLabel[level]}</option>
          ))}
        </Select>
        <Input aria-label="From date" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="h-11 w-auto" />
        <Input aria-label="To date" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="h-11 w-auto" />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<History className="h-5 w-5" />} title="No assessments match." description="Try another student, module or risk level." />
      ) : (
        <>
          <DataTable
            caption="Assessment history"
            rows={visible}
            rowKey={(row) => row.id}
            columns={[
              { key: "date", header: "Date", cell: (row: Assessment) => formatDate(row.createdAt, preferences.dateFormat) },
              { key: "student", header: "Student", cell: (row) => students.find((student) => student.id === row.studentId)?.name ?? "Student" },
              { key: "type", header: "Assessment", cell: (row) => moduleFullLabel[row.type as AssessmentType] },
              { key: "score", header: "Score", cell: (row) => row.dyslexiaAudio ? "Not assessed" : row.adhdResult ? adhdScreenStatus(row.adhdResult.screenPositive) : `${row.score}%` },
              { key: "risk", header: "Risk", cell: (row) => row.dyslexiaAudio ? <span className="text-sm text-muted">Not assessed</span> : <RiskBadge level={row.riskLevel} /> },
              { key: "teacher", header: "Teacher", cell: (row) => row.teacher },
              { key: "action", header: "Action", cell: (row) => <Link href={`/results/${row.id}`}><Button variant="secondary" size="sm">View Result</Button></Link> },
            ]}
          />
          <Pagination page={page} pages={pages} onPage={setPage} />
        </>
      )}
    </div>
  );
}
