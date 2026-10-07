"use client";

import type { NotificationType } from "@/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type NotificationPrefs = Record<NotificationType, boolean>;

const notificationDefaults: NotificationPrefs = {
  elevated_result: true,
  pending_assessment: true,
  report_generated: true,
  behaviour_logged: true,
};

function readNotifications(raw: unknown): NotificationPrefs {
  const source = raw && typeof raw === "object" ? (raw as Record<string, boolean>) : {};
  return {
    elevated_result: source.elevated_result ?? source.elevated ?? notificationDefaults.elevated_result,
    pending_assessment: source.pending_assessment ?? source.pending ?? notificationDefaults.pending_assessment,
    report_generated: source.report_generated ?? source.report ?? notificationDefaults.report_generated,
    behaviour_logged: source.behaviour_logged ?? source.behaviour ?? notificationDefaults.behaviour_logged,
  };
}

export interface Preferences {
  defaultClass: string;
  dateFormat: "dd MMM yyyy" | "d MMM yyyy" | "yyyy-MM-dd";
  density: "comfortable" | "compact";
  notifications: NotificationPrefs;
}

const defaultPreferences: Preferences = {
  defaultClass: "all",
  dateFormat: "dd MMM yyyy",
  density: "comfortable",
  notifications: notificationDefaults,
};

interface PreferencesContextValue {
  preferences: Preferences;
  setPreferences: (next: Preferences) => void;
  updatePreferences: (partial: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);
const KEY = "learnguard-preferences-v1";

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate preferences after mount */
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<Preferences> & { notifications?: unknown };
        setPreferences({
          ...defaultPreferences,
          ...parsed,
          notifications: readNotifications(parsed.notifications),
        });
      } catch {
        setPreferences(defaultPreferences);
      }
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(preferences));
  }, [preferences, ready]);

  const value = useMemo(
    () => ({
      preferences,
      setPreferences,
      updatePreferences: (partial: Partial<Preferences>) =>
        setPreferences((current) => ({ ...current, ...partial })),
    }),
    [preferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used within PreferencesProvider");
  return context;
}
