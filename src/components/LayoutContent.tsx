"use client";

import { usePathname } from "next/navigation";
import { ConditionalNavbar } from "./ConditionalNavbar";
import { Sidebar } from "./Sidebar";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth/");
  const isOnboarding = pathname === "/onboarding";

  // Don't show sidebar/navbar for auth and onboarding pages
  if (isAuthPage || isOnboarding) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="drawer lg:drawer-open">
      <input id="drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-screen">
        <ConditionalNavbar />
        <div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
      </div>
      <div className="drawer-side z-50">
        <label htmlFor="drawer" className="drawer-overlay"></label>
        <Sidebar />
      </div>
    </div>
  );
}
