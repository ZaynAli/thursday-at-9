import { Home, Trophy, Users, User, LogIn, Shield, Swords, type LucideIcon } from "lucide-react";
import type { Profile } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const allNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/game", label: "Game", icon: Swords },
  { href: "/fantasy", label: "Fantasy", icon: Trophy },
  { href: "/league", label: "League", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname.startsWith("/admin");
  return pathname === href;
}

export function getNavItemsForUser(user: Profile | null): NavItem[] {
  if (!user) {
    return [
      { href: "/", label: "Home", icon: Home },
      { href: "/game", label: "Game", icon: Swords },
      { href: "/league", label: "League", icon: Users },
      { href: "/login", label: "Sign in", icon: LogIn },
    ];
  }

  const items = allNavItems.filter(
    (item) => item.href !== "/fantasy" || user.isFantasyManager
  );

  if (user.isAdmin) {
    items.push({ href: "/admin", label: "Admin", icon: Shield });
  }

  return items;
}
