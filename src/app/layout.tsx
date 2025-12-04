import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutContent } from "@/components/LayoutContent";
import { Analytics } from "@vercel/analytics/next";
import SessionMonitor from "@/components/SessionMonitor";
import { Toaster } from "sonner";
import ImpersonationBannerWrapper from "@/components/ImpersonationBannerWrapper";
import { SessionProvider } from "@/contexts/SessionContext";

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
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          <SessionMonitor />
          <ImpersonationBannerWrapper />
          <LayoutContent>{children}</LayoutContent>
          <Toaster position="top-right" richColors />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
