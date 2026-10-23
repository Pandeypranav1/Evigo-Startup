"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/client";

export type UserRole = "client" | "provider";

export type UserSession = {
  id: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  createdAt?: string;
};

type AuthState = {
  user: UserSession | null;
  role: UserRole | null;
  loading: boolean;
  login: (user: UserSession) => void;
  signOut: () => Promise<boolean>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let revision = 0;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const restore = async (id?: string) => {
      const current = ++revision;
      if (!id) {
        localStorage.removeItem("evigo_user");
        if (active) { setUser(null); setLoading(false); }
        return;
      }
      // Never carry a previous account into a newly authenticated session.
      setUser((previous) => previous?.id === id ? previous : null);
      let unauthorized = false;
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        unauthorized = response.status === 401;
        if (unauthorized) throw new Error("Session expired");
        const data = await response.json();
        if (!response.ok || !data.profile) throw new Error("Profile unavailable");
        if (!active || current !== revision) return;
        const restored: UserSession = {
          id, email: data.profile.email || "",
          role: data.profile.role === "provider" ? "provider" : "client",
          profileImage: data.profile.avatar_url || undefined,
        };
        localStorage.setItem("evigo_user", JSON.stringify(restored));
        setUser(restored);
      } catch {
        if (active && current === revision) {
          if (unauthorized) localStorage.removeItem("evigo_user");
          setUser((previous) => !unauthorized && previous?.id === id ? previous : null);
        }
      } finally {
        if (active && current === revision) setLoading(false);
      }
    };
    // Do not await Supabase operations inside the auth callback (auth lock).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void restore(session?.user.id);
    });
    return () => { active = false; revision++; subscription.unsubscribe(); };
  }, []);

  const login = useCallback((u: UserSession) => {
    localStorage.setItem("evigo_user", JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await createClient().auth.signOut();
      if (error) return false;
      localStorage.removeItem("evigo_user");
      setUser(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      role: user?.role ?? null,
      loading,
      login,
      signOut,
    }),
    [user, loading, login, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
