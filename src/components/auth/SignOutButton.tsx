"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="sm" className="shrink-0">
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </form>
  );
}
