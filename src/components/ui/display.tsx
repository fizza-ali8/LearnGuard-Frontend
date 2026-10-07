"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Card({
  className,
  children,
  hover,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface p-5 md:p-6",
        hover && "transition-shadow duration-200 hover:shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8">
      {breadcrumb}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-[30px] leading-tight font-bold text-heading md:text-[32px]">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted md:text-[15px]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold text-heading">{title}</h2>
      {action}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-faint">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <span aria-hidden>/</span> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-primary-dark">
                {item.label}
              </Link>
            ) : (
              <span className="text-muted">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Avatar({ name, className, src }: { name: string; className?: string; src?: string }) {
  const letters = name
    .replace(/^Ms\.\s|^Mr\.\s/i, "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  if (src) {
    return <img src={src} alt="" className={cn("h-10 w-10 rounded-full object-cover", className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-dark",
        className,
      )}
    >
      {letters}
    </span>
  );
}

export function StudentAvatar({ name, className }: { name: string; className?: string }) {
  return <Avatar name={name} className={className} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-dark">{icon}</div>
      <h2 className="text-lg font-semibold text-heading">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center" role="alert">
      <h2 className="text-lg font-semibold text-heading">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function DemoBadge({ label = "Demo result" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-lavender-border bg-primary-softer px-2 py-0.5 text-[11px] font-medium text-primary-dark">
      {label}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-[#EEF0F4]", className)} />;
}

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full border px-3 text-[13px] font-medium transition-colors",
        active ? "border-primary bg-primary-soft text-primary-dark" : "border-line bg-surface text-body hover:bg-primary-softer",
      )}
    >
      {children}
    </button>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "h-11 shrink-0 border-b-2 px-3 text-sm font-medium",
              selected ? "border-primary-dark text-primary-dark" : "border-transparent text-muted hover:text-heading",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function LinkTabs({ tabs }: { tabs: { href: string; label: string; active: boolean }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "h-11 shrink-0 border-b-2 px-3 text-sm leading-[44px] font-medium",
            tab.active ? "border-primary-dark text-primary-dark" : "border-transparent text-muted hover:text-heading",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export function Accordion({
  items,
}: {
  items: { id: string; title: string; content: React.ReactNode }[];
}) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
      {items.map((item) => {
        const expanded = open === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              aria-expanded={expanded}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-heading"
              onClick={() => setOpen(expanded ? null : item.id)}
            >
              {item.title}
              <ChevronRight className={cn("h-4 w-4 text-muted transition-transform", expanded && "rotate-90")} />
            </button>
            <div className={cn("grid transition-[grid-template-rows] duration-200", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-sm leading-6 text-body">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[760px] border-collapse text-left">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-soft text-xs font-medium tracking-wide text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn("px-4 py-3 font-medium", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-line transition-colors hover:bg-primary-softer">
              {columns.map((column) => (
                <td key={column.key} className={cn("px-4 py-3 align-middle text-sm text-body", column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex h-9 items-center gap-1 rounded-[10px] border border-line bg-surface px-3 disabled:opacity-40"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button
          type="button"
          className="flex h-9 items-center gap-1 rounded-[10px] border border-line bg-surface px-3 disabled:opacity-40"
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-[10px] border border-line bg-surface pr-3 pl-3 text-sm text-heading outline-none placeholder:text-faint focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}
