"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";

// Session type matching what the API returns
interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  church?: { id: string; name: string };
  permissions?: {
    canManageUsers?: boolean;
    canManageClasses?: boolean;
    canEditStudents?: boolean;
    canTakeAttendance?: boolean;
    canManageTests?: boolean;
    canViewReports?: boolean;
  };
}

interface ImpersonationInfo {
  isImpersonating: boolean;
  originalUserId?: string;
  originalUserName?: string;
  impersonatedUserId?: string;
  impersonatedUserName?: string;
}

interface Session {
  user: SessionUser;
  accessToken: string;
  refreshToken?: string;
  impersonation: ImpersonationInfo;
}

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  const fetchSession = useCallback(async () => {
    // Skip fetching on auth pages - no session expected
    if (pathname?.startsWith("/auth/")) {
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setError(null);
      } else if (response.status === 401) {
        // Not authenticated - this is expected for logged out users
        setSession(null);
        setError(null);
      } else {
        setError("Failed to fetch session");
        setSession(null);
      }
    } catch (err) {
      console.error("Error fetching session:", err);
      setError("Network error");
      // Don't clear session on network errors - might be temporary
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  // Fetch session once on mount (and when pathname changes to/from auth pages)
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Listen for 401 responses to detect session expiry
  useEffect(() => {
    if (pathname?.startsWith("/auth/")) {
      return;
    }

    const handleFetchError = (event: Event) => {
      // Custom event dispatched when a 401 is received
      if (pathname && !pathname.startsWith("/auth/")) {
        setSession(null);
        window.location.href = "/auth/signin?error=session_expired";
      }
    };

    window.addEventListener("session-expired", handleFetchError);
    return () => window.removeEventListener("session-expired", handleFetchError);
  }, [pathname]);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    await fetchSession();
  }, [fetchSession]);

  return (
    <SessionContext.Provider value={{ session, loading, error, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
