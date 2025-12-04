"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * SessionMonitor - Intercepts 401 responses to handle session expiration
 * Redirects to login when any API call returns 401
 *
 * Note: Session state is managed by SessionContext - this component
 * only handles the global 401 interception for session expiry detection.
 */
export default function SessionMonitor() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip on auth pages
    if (pathname?.startsWith("/auth/")) {
      return;
    }

    // Intercept fetch to detect 401 responses
    const originalFetch = window.fetch;

    const interceptedFetch: typeof fetch = async (...args) => {
      const response = await originalFetch(...args);

      // If we get a 401 on any API call, session has expired
      if (response.status === 401) {
        // Check if it's an API call (not a static resource)
        const url = typeof args[0] === "string" ? args[0] : args[0] instanceof Request ? args[0].url : "";
        if (url.includes("/api/") && !pathname?.startsWith("/auth/")) {
          console.warn("Session expired (401 received). Redirecting to login...");
          window.location.href = "/auth/signin?error=session_expired";
        }
      }

      return response;
    };

    window.fetch = interceptedFetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, []); // Empty dependency array - only set up once

  return null;
}
