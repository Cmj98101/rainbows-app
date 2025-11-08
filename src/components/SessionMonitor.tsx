"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * SessionMonitor - Monitors for session expiration and auth errors
 * Automatically redirects to login when session expires
 */
export default function SessionMonitor() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip monitoring on public pages
    if (pathname.startsWith('/auth/')) {
      return;
    }

    // Check session periodically (every 5 minutes)
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          // Session expired or invalid
          console.warn('Session expired, redirecting to login...');
          router.push('/auth/signin?error=session_expired');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // On network error, don't redirect - might be temporary
      }
    };

    // Check immediately on mount
    checkSession();

    // Then check every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [pathname, router]);

  // Listen for global fetch errors (401 Unauthorized)
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // If we get a 401 on any API call, session has expired
      if (response.status === 401 && !pathname.startsWith('/auth/')) {
        console.warn('Received 401, session expired. Redirecting to login...');
        router.push('/auth/signin?error=session_expired');
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [pathname, router]);

  return null; // This component doesn't render anything
}
