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
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-border bg-surface mobile-nav-inset">
      <div className="flex items-stretch justify-around px-1 pt-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={cn(
                "flex min-h-12 min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 select-none",
                "active:opacity-70 active:scale-[0.97] transition-[opacity,transform] duration-75",
                active ? "text-lime" : "text-text-muted"
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
        <div className="absolute top-0 left-0 right-0 h-px bg-lime/30" />
      )}
    </nav>
  );
}
