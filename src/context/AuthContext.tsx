"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/client";
import { isAccountRole } from "@/lib/auth-role";

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
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    let syncId = 0;

    const syncSession = async (sessionUser: { id: string; email?: string } | null) => {
      const currentSyncId = ++syncId;
      if (!sessionUser) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (active) setLoading(true);
      try {
        const response = await fetch(
          `/api/profile?user_id=${encodeURIComponent(sessionUser.id)}`,
          { cache: "no-store" }
        );
        const result = await response.json();
        if (!response.ok || !result.success || !isAccountRole(result.profile?.role)) {
          throw new Error(result.error || "A valid account profile could not be loaded.");
        }
        if (!active || currentSyncId !== syncId) return;
        setUser({
          id: sessionUser.id,
          email: sessionUser.email || result.profile.email || "",
          role: result.profile.role,
          profileImage: result.profile.avatar_url || undefined,
        });
      } catch (error) {
        if (!active || currentSyncId !== syncId) return;
        console.error("Failed to restore authenticated account profile", error);
        setUser(null);
      } finally {
        if (active && currentSyncId === syncId) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback((u: UserSession) => {
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await createClient().auth.signOut();
    if (error) {
      console.error("Failed to invalidate Supabase session", error);
      throw error;
    }
    setUser(null);
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
