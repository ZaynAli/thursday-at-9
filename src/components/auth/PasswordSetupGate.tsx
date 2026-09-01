"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const EXEMPT_PREFIXES = ["/login/set-password", "/auth/callback"];

interface PasswordSetupGateProps {
  needsPasswordSetup: boolean;
  children: React.ReactNode;
}

export function PasswordSetupGate({
  needsPasswordSetup,
  children,
}: PasswordSetupGateProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!needsPasswordSetup) return;
    if (EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

    const next = pathname.startsWith("/") ? pathname : "/";
    router.replace(`/login/set-password?next=${encodeURIComponent(next)}`);
  }, [needsPasswordSetup, pathname, router]);

  return children;
}
