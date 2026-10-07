"use client";

import { Popover } from "@/components/ui/overlay";
import { RiskBadge } from "@/components/ui/risk";
import { moduleFullLabel } from "@/lib/risk";
import { useData } from "@/providers/data-provider";
import { format, parseISO } from "date-fns";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function GlobalSearch() {
  const { students, assessments, reports } = useData();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 1) {
      return {
        students: students.slice(0, 4),
        assessments: assessments.slice(0, 3),
        reports: reports.slice(0, 2),
      };
    }
    return {
      students: students.filter((student) => `${student.name} ${student.code}`.toLowerCase().includes(term)).slice(0, 5),
      assessments: assessments
        .filter((item) => {
          const student = students.find((entry) => entry.id === item.studentId);
          return `${student?.name ?? ""} ${moduleFullLabel[item.type]}`.toLowerCase().includes(term);
        })
        .slice(0, 4),
      reports: reports
        .filter((report) => {
          const student = students.find((entry) => entry.id === report.studentId);
          return `${student?.name ?? ""} report`.toLowerCase().includes(term);
        })
        .slice(0, 3),
    };
  }, [assessments, query, reports, students]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
      <label className="relative block">
        <span className="sr-only">Search students, assessments or reports</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search students, assessments or reports…"
          className="h-11 w-full rounded-[10px] border border-line bg-soft pr-16 pl-9 text-sm text-heading outline-none placeholder:text-faint focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line px-1.5 py-0.5 text-[10px] text-faint">
          Ctrl K
        </span>
      </label>
      <Popover open={open} onClose={() => setOpen(false)} align="left" className="w-full">
        <SearchGroup title="Students">
          {results.students.length ? (
            results.students.map((student) => (
              <button key={student.id} type="button" onClick={() => go(`/students/${student.id}`)} className="flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left hover:bg-primary-softer">
                <span>
                  <span className="block text-sm font-medium text-heading">{student.name}</span>
                  <span className="text-xs text-faint">Grade {student.grade} · {student.code}</span>
                </span>
                {student.riskProfile.overallConcern ? <RiskBadge level={student.riskProfile.overallConcern} /> : null}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted">No matching students.</p>
          )}
        </SearchGroup>
        <SearchGroup title="Assessments">
          {results.assessments.map((item) => {
            const student = students.find((entry) => entry.id === item.studentId);
            return (
              <button key={item.id} type="button" onClick={() => go(`/results/${item.id}`)} className="block w-full rounded-[10px] px-3 py-2 text-left hover:bg-primary-softer">
                <span className="block text-sm font-medium text-heading">{moduleFullLabel[item.type]}</span>
                <span className="text-xs text-faint">
                  {student?.name} · {format(parseISO(item.createdAt), "dd MMM")}
                </span>
              </button>
            );
          })}
        </SearchGroup>
        <SearchGroup title="Reports">
          {results.reports.length ? (
            results.reports.map((report) => {
              const student = students.find((entry) => entry.id === report.studentId);
              return (
                <button key={report.id} type="button" onClick={() => go(`/reports/${report.studentId}`)} className="block w-full rounded-[10px] px-3 py-2 text-left hover:bg-primary-softer">
                  <span className="block text-sm font-medium text-heading">{student?.name} screening report</span>
                  <span className="text-xs text-faint">{format(parseISO(report.createdAt), "dd MMM yyyy")}</span>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-2 text-sm text-muted">No matching reports.</p>
          )}
        </SearchGroup>
      </Popover>
    </div>
  );
}

function SearchGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-1 py-1">
      <p className="px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-faint">{title}</p>
      {children}
    </div>
  );
}
