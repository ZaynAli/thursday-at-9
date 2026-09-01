"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Calendar, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Overview", icon: ClipboardList, exact: true },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/gameweek", label: "Gameweek", icon: Calendar },
  { href: "/admin/results", label: "Results", icon: ClipboardList },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {adminNav.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact
          ? pathname === href
          : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
              isActive
                ? "bg-lime/10 text-lime border-lime/30"
                : "bg-surface-elevated text-text-muted border-border hover:text-text-secondary"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
