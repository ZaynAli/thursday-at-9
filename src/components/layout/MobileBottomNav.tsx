"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Users, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/context/AppSessionContext";
import { getNavItemsForUser } from "@/lib/nav";

export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const navItems = getNavItemsForUser(user);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-border bg-surface/95 backdrop-blur-md">
      <div className="flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 px-1 transition-colors",
                active ? "text-lime" : "text-text-muted active:text-text-secondary"
              )}
            >
              <Icon
                className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_rgba(163,230,53,0.4)]")}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
      {user?.isAdmin && pathname.startsWith("/admin") && (
        <div className="absolute -top-px left-0 right-0 h-px bg-lime/30" />
      )}
    </nav>
  );
}
