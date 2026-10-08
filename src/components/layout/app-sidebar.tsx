"use client";

import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/display";
import { Tooltip } from "@/components/ui/overlay";
import { NAV_GROUPS, TEACHER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function SidebarNav({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useSession();
  const name = user?.name ?? TEACHER.name;

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b border-line px-4", collapsed && "justify-center px-2")}>
        <Logo href="/dashboard" compact={collapsed} />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {collapsed ? null : (
              <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-faint">{group.label}</p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
                const Icon = item.icon;
                const link = (
                  <Link
                    href={item.href}
                    prefetch={false}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active ? "bg-primary-soft text-primary-dark" : "text-body hover:bg-primary-softer",
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary-dark" : "text-muted")} />
                    {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                  </Link>
                );
                return <li key={item.href}>{collapsed ? <Tooltip label={item.label}>{link}</Tooltip> : link}</li>;
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className={cn("border-t border-line p-3", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-3 rounded-[10px] px-2 py-2", collapsed && "justify-center px-0")}>
          <Avatar name={name} className="h-9 w-9" />
          {collapsed ? null : (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-heading">{name}</p>
              <p className="text-xs text-faint">{user?.role ?? TEACHER.role}</p>
            </div>
          )}
        </div>
        {(() => {
          const logout = (
            <button
              type="button"
              onClick={() => {
                signOut();
                onNavigate?.();
                router.push("/login");
              }}
              className={cn(
                "mt-1 flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-body hover:bg-primary-softer",
                collapsed && "justify-center px-0",
              )}
            >
              <LogOut className="h-[18px] w-[18px] text-muted" />
              {collapsed ? <span className="sr-only">Logout</span> : "Logout"}
            </button>
          );
          return collapsed ? <Tooltip label="Logout">{logout}</Tooltip> : logout;
        })()}
      </div>
    </div>
  );
}
