"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  workspaceId: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetchSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_PATHS = ["/login"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/session", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          setUser(json.user);
          return;
        }
      }
      setUser(null);
      // Redirect to login if not on a public path
      if (!PUBLIC_PATHS.includes(pathname)) {
        router.push("/login");
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // swallow
    }
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Re-validate session every 10 minutes to catch expiry
  useEffect(() => {
    const interval = setInterval(fetchSession, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refetchSession: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
