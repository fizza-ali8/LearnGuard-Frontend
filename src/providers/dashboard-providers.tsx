"use client";

import { DataProvider } from "@/providers/data-provider";
import { PreferencesProvider } from "@/providers/preferences-provider";

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <DataProvider>{children}</DataProvider>
    </PreferencesProvider>
  );
}
