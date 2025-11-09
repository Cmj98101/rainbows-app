"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ImpersonationBannerProps {
  impersonatedUserName: string;
  originalUserName: string;
}

export default function ImpersonationBanner({
  impersonatedUserName,
  originalUserName,
}: ImpersonationBannerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStopImpersonation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/stop-impersonate", {
        method: "POST",
      });

      if (response.ok) {
        // Force a full page reload to refresh all components with original user session
        window.location.href = "/";
      } else {
        console.error("Failed to stop impersonation");
        alert("Failed to stop impersonation. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error stopping impersonation:", error);
      alert("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-warning text-warning-content px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <span className="font-semibold">Acting as {impersonatedUserName}</span>
            <span className="ml-2 text-sm opacity-90">
              (You are {originalUserName})
            </span>
          </div>
        </div>
        <button
          onClick={handleStopImpersonation}
          disabled={isLoading}
          className="btn btn-sm btn-ghost hover:bg-warning-content hover:text-warning"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            "Exit Acting Mode"
          )}
        </button>
      </div>
    </div>
  );
}
