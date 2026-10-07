"use client";

import { TEACHER } from "@/lib/constants";
import { logout, signIn, signInDemo, type SessionUser } from "@/services/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface SessionContextValue {
  user: SessionUser | null;
  ready: boolean;
  signInWithEmail: (email: string, remember: boolean) => Promise<void>;
  signInWithDemo: () => Promise<void>;
  signOut: () => void;
  updateUser: (partial: Partial<SessionUser>) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);
const KEY = "learnguard-session";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate the session after mount */
    const saved = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved) as SessionUser);
      } catch {
        setUser(null);
      }
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      ready,
      async signInWithEmail(email, remember) {
        const next = await signIn(email);
        setUser(next);
        if (remember) localStorage.setItem(KEY, JSON.stringify(next));
        else sessionStorage.setItem(KEY, JSON.stringify(next));
      },
      async signInWithDemo() {
        const next = await signInDemo();
        setUser(next);
        localStorage.setItem(KEY, JSON.stringify(next));
      },
      signOut() {
        void logout();
        setUser(null);
        localStorage.removeItem(KEY);
        sessionStorage.removeItem(KEY);
      },
      updateUser(partial) {
        setUser((current) => {
          const next = { ...(current ?? { name: TEACHER.name, email: TEACHER.email, role: TEACHER.role, school: TEACHER.school }), ...partial };
          localStorage.setItem(KEY, JSON.stringify(next));
          return next;
        });
      },
    }),
    [ready, user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
}
