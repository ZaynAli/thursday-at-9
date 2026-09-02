"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/context/AppSessionContext";
import { getNavItemsForUser, isNavItemActive } from "@/lib/nav";

export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const navItems = getNavItemsForUser(user);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden pointer-events-none mobile-nav-inset"
    >
      <div className="mx-auto flex justify-center px-5 pb-1">
        <div
          className={cn(
            "pointer-events-auto flex items-center gap-0.5 rounded-full p-1.5",
            "border border-white/10 bg-surface/85 backdrop-blur-xl",
            "shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]"
          )}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isNavItemActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                prefetch
                aria-label={label}
                aria-current={active ? "page" : undefined}
                title={label}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full select-none",
                  "transition-[color,background-color,transform] duration-150",
                  "active:scale-95",
                  active
                    ? "bg-white/12 text-text-primary"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
