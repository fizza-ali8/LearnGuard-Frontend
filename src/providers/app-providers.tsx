"use client";

import { DataProvider } from "@/providers/data-provider";
import { PreferencesProvider } from "@/providers/preferences-provider";
import { SessionProvider } from "@/providers/session-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PreferencesProvider>
        <DataProvider>{children}</DataProvider>
      </PreferencesProvider>
    </SessionProvider>
  );
}
