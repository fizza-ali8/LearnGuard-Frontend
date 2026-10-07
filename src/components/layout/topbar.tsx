"use client";

import { GlobalSearch } from "@/components/layout/global-search";
import { Avatar, DemoBadge } from "@/components/ui/display";
import { isDemoMode } from "@/lib/api";
import { DropdownMenu, Popover } from "@/components/ui/overlay";
import { TEACHER } from "@/lib/constants";
import { greeting } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useData } from "@/providers/data-provider";
import { usePreferences } from "@/providers/preferences-provider";
import { useSession } from "@/providers/session-provider";
import { format, parseISO } from "date-fns";
import { Bell, Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const titles: [string, string][] = [
  ["/dashboard", "Today’s screening overview"],
  ["/students", "Student records"],
  ["/assessment", "New assessment"],
  ["/behaviour", "Behaviour logs"],
  ["/heatmap", "Class heatmap"],
  ["/analytics", "Analytics"],
  ["/history", "Assessment history"],
  ["/reports", "Reports"],
  ["/models", "Models and validation"],
  ["/settings", "Settings"],
  ["/help", "Help"],
  ["/results", "Screening result"],
];

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useSession();
  const { sections, classScope, setClassScope, notifications, markAllNotificationsRead, markNotificationRead } = useData();
  const { preferences } = usePreferences();
  const [bellOpen, setBellOpen] = useState(false);
  const context = titles.find(([href]) => pathname.startsWith(href))?.[1] ?? "LearnGuard";
  const visible = useMemo(
    () => notifications.filter((item) => preferences.notifications[item.kind]),
    [notifications, preferences.notifications],
  );
  const unread = visible.filter((item) => !item.read).length;
  const name = user?.name ?? TEACHER.name;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 md:px-6">
      <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-line md:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu className="h-4 w-4" />
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-heading">
          {greeting()}, {name.replace("Ms. ", "Ms. ").split(" ").slice(0, 2).join(" ")}
        </p>
        <p className="hidden truncate text-xs text-faint sm:block">
          {context}
          <span className="mx-1.5 text-line">·</span>
          Academic Year 2026
          <span className="mx-1.5 text-line">·</span>
          Viewing: {classScope === "all" ? "All classes" : `Class ${classScope}`}
        </p>
      </div>
      <GlobalSearch />
      {isDemoMode() ? <DemoBadge label="Demo mode" /> : null}
      <div className="ml-auto flex items-center gap-2">
        <label className="hidden lg:block">
          <span className="sr-only">Class</span>
          <select
            value={classScope}
            onChange={(event) => setClassScope(event.target.value)}
            className="h-11 rounded-[10px] border border-line bg-surface px-3 text-sm text-heading"
          >
            <option value="all">All classes</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                Class {section}
              </option>
            ))}
          </select>
        </label>
        <div className="relative">
          <button
            type="button"
            aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-line bg-surface text-heading hover:bg-primary-softer"
            onClick={() => setBellOpen((value) => !value)}
          >
            <Bell className="h-4 w-4" />
            {unread ? <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" /> : null}
          </button>
          <Popover open={bellOpen} onClose={() => setBellOpen(false)}>
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold text-heading">Notifications</p>
              <button type="button" className="text-xs font-medium text-primary-dark" onClick={markAllNotificationsRead}>
                Mark all read
              </button>
            </div>
            {visible.length ? (
              visible.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn("block w-full rounded-[10px] px-3 py-2 text-left hover:bg-primary-softer", !item.read && "bg-primary-softer/60")}
                  onClick={() => {
                    markNotificationRead(item.id);
                    setBellOpen(false);
                    if (item.href) router.push(item.href);
                  }}
                >
                  <span className="block text-sm font-medium text-heading">{item.title}</span>
                  <span className="block text-xs leading-5 text-muted">{item.body}</span>
                  <span className="text-[11px] text-faint">{format(parseISO(item.createdAt), "dd MMM, h:mm a")}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-sm text-muted">No notifications right now.</p>
            )}
          </Popover>
        </div>
        <DropdownMenu
          trigger={
            <button type="button" className="flex h-11 items-center gap-2 rounded-[10px] border border-line bg-surface pr-3 pl-1.5" aria-label="Account menu">
              <Avatar name={name} className="h-8 w-8" />
              <span className="hidden text-sm font-medium text-heading lg:inline">{name.split(" ").slice(-1)}</span>
            </button>
          }
          items={[
            { label: "Settings", href: "/settings" },
            { label: "Help", href: "/help" },
            {
              label: "Logout",
              destructive: true,
              onClick: () => {
                signOut();
                router.push("/login");
              },
            },
          ]}
        />
      </div>
    </header>
  );
}
