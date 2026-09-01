"use client";

import { usePathname } from "next/navigation";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { GameweekOpenBanner } from "@/components/shared/GameweekOpenBanner";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

const MINIMAL_SHELL_PATHS = ["/login", "/join", "/auth/callback"];

export function AppShell({ children, className = "" }: AppShellProps) {
  const pathname = usePathname();
  const minimal = MINIMAL_SHELL_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (minimal) {
    return (
      <div className="min-h-screen bg-background stadium-gradient">
        <main className={`min-h-screen safe-bottom ${className}`}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background stadium-gradient">
      <DesktopSidebar />
      <main
        className={`lg:pl-56 min-h-screen safe-bottom lg:pb-0 lg:safe-bottom-0 ${className}`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <GameweekOpenBanner />
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
