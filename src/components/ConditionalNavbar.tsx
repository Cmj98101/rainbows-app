"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  if (pathname === "/") {
    return (
      <div className="lg:hidden">
        <Navbar />
      </div>
    );
  }
  return <Navbar />;
}
