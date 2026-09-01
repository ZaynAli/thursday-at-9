"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { finalizeAuthCallback } from "@/lib/auth/finalize-callback.server";
import { createClient } from "@/lib/supabase/client";

async function waitForSession(
  supabase: ReturnType<typeof createClient>,
  timeoutMs = 3000
): Promise<boolean> {
  const existing = (await supabase.auth.getSession()).data.session;
  if (existing) return true;

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      subscription.unsubscribe();
      resolve(false);
    }, timeoutMs);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        window.clearTimeout(timeout);
        subscription.unsubscribe();
        resolve(true);
      }
    });
  });
}

/** Handles implicit/hash token flows that never reach the server. */
export function AuthCallbackClient() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function completeSignIn() {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        if (error) {
          router.replace("/login?error=auth");
          return;
        }
      } else if (window.location.hash) {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            router.replace("/login?error=auth");
            return;
          }
        }
      } else {
        router.replace("/login?error=missing_code");
        return;
      }

      const hasSession = await waitForSession(supabase);
      if (!hasSession) {
        router.replace("/login?error=missing_code");
        return;
      }

      const { redirectTo } = await finalizeAuthCallback();
      router.refresh();
      router.replace(redirectTo);
    }

    completeSignIn().catch(() => {
      router.replace("/login?error=auth");
    });
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-text-muted">Signing you in…</p>
    </div>
  );
}
