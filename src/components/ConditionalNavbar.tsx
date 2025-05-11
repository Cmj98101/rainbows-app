"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();

  // Show navbar on mobile for all pages
  return (
    <div className="lg:hidden">
      <Navbar />
    </div>
  );
}
