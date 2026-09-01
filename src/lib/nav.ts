import { Home, Trophy, Users, User, LogIn, type LucideIcon } from "lucide-react";
import type { Profile } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const allNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/fantasy", label: "Fantasy", icon: Trophy },
  { href: "/league", label: "League", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function getNavItemsForUser(user: Profile | null): NavItem[] {
  if (!user) {
    return [
      { href: "/", label: "Home", icon: Home },
      { href: "/league", label: "League", icon: Users },
      { href: "/login", label: "Sign in", icon: LogIn },
    ];
  }

  return allNavItems.filter(
    (item) => item.href !== "/fantasy" || user.isFantasyManager
  );
}
