"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Users, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/context/AppSessionContext";
import { LEAGUE_NAME } from "@/lib/constants";
import { getNavItemsForUser } from "@/lib/nav";

export function DesktopSidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const items = getNavItemsForUser(user);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 lg:left-0 lg:border-r lg:border-sidebar-border lg:bg-sidebar">
      <div className="flex flex-col h-full px-4 py-6">
        {/* Brand */}
        <Link href="/" className="mb-8 px-2 group">
          <span className="text-xl font-bold tracking-tight text-text-primary">
            {LEAGUE_NAME.split("@")[0]}
            <span className="text-lime">@{LEAGUE_NAME.split("@")[1]}</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-accent text-lime"
                    : "text-text-secondary hover:bg-sidebar-accent hover:text-text-primary"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Admin link */}
        {user?.isAdmin && (
          <div className="mt-auto pt-4 border-t border-sidebar-border">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                pathname.startsWith("/admin")
                  ? "bg-sidebar-accent text-lime"
                  : "text-text-muted hover:bg-sidebar-accent hover:text-text-secondary"
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
