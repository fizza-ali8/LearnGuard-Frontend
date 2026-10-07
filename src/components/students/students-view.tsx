"use client";

import { Button } from "@/components/ui/button";
import { DataTable, EmptyState, FilterChip, PageHeader, Pagination, SearchBox, Skeleton, StudentAvatar } from "@/components/ui/display";
import { Select } from "@/components/ui/inputs";
import { DropdownMenu } from "@/components/ui/overlay";
import { RiskBadge } from "@/components/ui/risk";
import { GRADES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { moduleLabel, riskLabel, screeningStatus, statusLabel } from "@/lib/risk";
import { usePreferences } from "@/providers/preferences-provider";
import { useData } from "@/providers/data-provider";
import type { AssessmentType, RiskLevel, Student } from "@/types";
import { Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const modules: AssessmentType[] = ["dyslexia", "dysgraphia", "adhd"];

export function StudentsView() {
  const { students, ready } = useData();
  const { preferences } = usePreferences();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("all");
  const [risk, setRisk] = useState("all");
  const [status, setStatus] = useState("all");
  const [recent, setRecent] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = students.filter((student) => {
      const matchesTerm = !term || `${student.name} ${student.code}`.toLowerCase().includes(term);
      const matchesGrade = grade === "all" || student.grade === grade;
      const matchesRisk = risk === "all" || student.riskProfile.overallConcern === risk;
      const matchesStatus = status === "all" || screeningStatus(student) === status;
      return matchesTerm && matchesGrade && matchesRisk && matchesStatus;
    });
    rows.sort((a, b) => (recent || true ? b.updatedAt.localeCompare(a.updatedAt) : a.name.localeCompare(b.name)));
    if (!recent) rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [grade, query, recent, risk, status, students]);

  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const visible = filtered.slice((page - 1) * 8, page * 8);

  if (!ready) {
    return (
      <div>
        <PageHeader title="Students" subtitle="Manage student profiles, screening status and records." />
        <Skeleton className="h-12" />
        <Skeleton className="mt-4 h-96" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Manage student profiles, screening status and records."
        actions={
          <Link href="/students/new">
            <Button>Add Student</Button>
          </Link>
        }
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="lg:w-80">
          <SearchBox value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Search by name or student ID…" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={status === "all" && grade === "all" && risk === "all" && !recent} onClick={() => { setStatus("all"); setGrade("all"); setRisk("all"); setRecent(false); setPage(1); }}>
            All Students
          </FilterChip>
          <Select value={grade} onChange={(event) => { setGrade(event.target.value); setPage(1); }} className="h-9 w-auto" aria-label="Grade">
            <option value="all">Grade</option>
            {GRADES.map((item) => (
              <option key={item} value={item}>Grade {item}</option>
            ))}
          </Select>
          <Select value={risk} onChange={(event) => { setRisk(event.target.value); setPage(1); }} className="h-9 w-auto" aria-label="Risk">
            <option value="all">Risk</option>
            {(["low", "moderate", "elevated", "high"] as RiskLevel[]).map((level) => (
              <option key={level} value={level}>{riskLabel[level]}</option>
            ))}
          </Select>
          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-9 w-auto" aria-label="Screening status">
            <option value="all">Screening Status</option>
            <option value="complete">Fully screened</option>
            <option value="partial">Partially screened</option>
            <option value="not_started">Not started</option>
          </Select>
          <FilterChip active={recent} onClick={() => { setRecent((value) => !value); setPage(1); }}>
            Recently Updated
          </FilterChip>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title={students.length ? "No students match these filters." : "No students added yet."}
          description={students.length ? "Clear a filter or search for another name or ID." : "Add the first student to begin screening and progress tracking."}
          action={
            <Link href="/students/new">
              <Button>Add Student</Button>
            </Link>
          }
        />
      ) : (
        <>
          <DataTable
            caption="Students"
            rows={visible}
            rowKey={(row) => row.id}
            columns={[
              {
                key: "student",
                header: "Student",
                cell: (student: Student) => (
                  <div className="flex items-center gap-3">
                    <StudentAvatar name={student.name} />
                    <div>
                      <p className="font-medium text-heading">{student.name}</p>
                      <p className="text-xs text-faint">{student.code}</p>
                    </div>
                  </div>
                ),
              },
              { key: "id", header: "ID", cell: (student) => student.code },
              { key: "grade", header: "Grade", cell: (student) => `Grade ${student.grade}` },
              {
                key: "latest",
                header: "Latest Screening",
                cell: (student) => statusLabel(screeningStatus(student)),
              },
              {
                key: "risk",
                header: "Risk Summary",
                cell: (student) => (
                  <div className="flex max-w-xs flex-col gap-1">
                    {modules.map((type) => {
                      const result = student.riskProfile[type];
                      return (
                        <span key={type} className="text-xs text-body">
                          {moduleLabel[type]}: {result ? <RiskBadge level={result.level} className="ml-1 px-2 py-0.5" /> : "Not assessed"}
                        </span>
                      );
                    })}
                  </div>
                ),
              },
              { key: "updated", header: "Last Updated", cell: (student) => formatDate(student.updatedAt, preferences.dateFormat) },
              {
                key: "action",
                header: "Action",
                cell: (student) => (
                  <div className="flex items-center gap-2">
                    <Link href={`/students/${student.id}`}>
                      <Button variant="secondary" size="sm">View Profile</Button>
                    </Link>
                    <DropdownMenu
                      trigger={<Button variant="tertiary" size="sm">More</Button>}
                      items={[
                        { label: "Start Assessment", href: `/assessment/new?student=${student.id}` },
                        { label: "View History", href: `/students/${student.id}/timeline` },
                        { label: "Generate Report", href: `/reports/${student.id}` },
                      ]}
                    />
                  </div>
                ),
              },
            ]}
          />
          <Pagination page={page} pages={pages} onPage={setPage} />
          <button type="button" className="sr-only" onClick={() => router.push("/students")}>
            Students
          </button>
        </>
      )}
    </div>
  );
}
