import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutContent } from "@/components/LayoutContent";
import { Analytics } from "@vercel/analytics/next";
import SessionMonitor from "@/components/SessionMonitor";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rainbows App",
  description: "A learning management system for special education",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionMonitor />
        <LayoutContent>{children}</LayoutContent>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  );
}
