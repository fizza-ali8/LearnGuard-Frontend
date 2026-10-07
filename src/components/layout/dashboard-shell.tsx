"use client";

import { SidebarNav } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Drawer } from "@/components/ui/overlay";
import { Skeleton } from "@/components/ui/display";
import { usePreferences } from "@/providers/preferences-provider";
import { useSession } from "@/providers/session-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useSession();
  const { preferences } = usePreferences();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, ready, router, user]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="mb-4 h-10 w-56" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-density={preferences.density}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[76px] border-r border-line bg-surface md:block lg:w-[248px]">
        <div className="hidden h-full lg:block">
          <SidebarNav />
        </div>
        <div className="h-full lg:hidden">
          <SidebarNav collapsed />
        </div>
      </aside>
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <SidebarNav onNavigate={() => setMobileOpen(false)} />
      </Drawer>
      <div className="md:pl-[76px] lg:pl-[248px]">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          {children}
          <p className="no-print mt-10 border-t border-line pt-4 text-xs leading-5 text-faint">
            LearnGuard · FYP 2026 · FAST-NUCES · Screening support only — not a clinical diagnosis.
          </p>
        </main>
      </div>
    </div>
  );
}
