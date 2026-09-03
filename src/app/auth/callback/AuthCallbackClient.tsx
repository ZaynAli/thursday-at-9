"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { finalizeAuthCallback } from "@/lib/auth/finalize-callback.server";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LEAGUE_NAME } from "@/lib/constants";

async function waitForSession(
  supabase: ReturnType<typeof createClient>,
  timeoutMs = 5000
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

/**
 * Use the universal `email` type (covers signup + magiclink token hashes).
 * Fall back to the URL type only if `email` is rejected for a non-expiry reason.
 */
async function verifyTokenHash(
  supabase: ReturnType<typeof createClient>,
  tokenHash: string,
  typeHint: string | null
) {
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });
  if (!error) return { ok: true as const };

  if (typeHint && typeHint !== "email") {
    const retry = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeHint as EmailOtpType,
    });
    if (!retry.error) return { ok: true as const };
    return { ok: false as const, message: retry.error.message };
  }

  return { ok: false as const, message: error.message };
}

/**
 * Handles auth callback without consuming the OTP on page load.
 * Messaging apps / email scanners often prefetch links and burn one-time tokens —
 * requiring an explicit click avoids that.
 */
export function AuthCallbackClient() {
  const router = useRouter();
  const started = useRef(false);
  const [status, setStatus] = useState<"ready" | "working" | "error">("ready");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsClick, setNeedsClick] = useState(false);
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [typeHint, setTypeHint] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const hash = params.get("token_hash");
    const type = params.get("type");
    const code = params.get("code");

    if (hash) {
      setTokenHash(hash);
      setTypeHint(type);
      setNeedsClick(true);
      return;
    }

    // Hash-token / legacy flows can complete without a button.
    if (window.location.hash || code) {
      void completeSignIn({ code });
      return;
    }

    setStatus("error");
    setErrorMessage("This setup link is missing its sign-in token. Ask the admin for a fresh link.");
  }, []);

  async function completeSignIn(options?: {
    code?: string | null;
    tokenHash?: string | null;
    typeHint?: string | null;
  }) {
    setStatus("working");
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const code = options?.code ?? params.get("code");
      const hash = options?.tokenHash ?? params.get("token_hash");
      const type = options?.typeHint ?? params.get("type");

      if (hash) {
        const result = await verifyTokenHash(supabase, hash, type);
        if (!result.ok) {
          setStatus("error");
          setErrorMessage(
            `${result.message} Ask the admin to generate a new link with npm run auth:link.`
          );
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus("error");
          setErrorMessage(
            `${error.message} Open the invite on the same device where you requested the email, or ask the admin for a fresh link.`
          );
          return;
        }
      } else if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setStatus("error");
            setErrorMessage(error.message);
            return;
          }
        }
      } else {
        setStatus("error");
        setErrorMessage("Sign-in could not be completed. Ask the admin for a fresh link.");
        return;
      }

      const hasSession = await waitForSession(supabase);
      if (!hasSession) {
        setStatus("error");
        setErrorMessage("Signed in, but the session did not stick. Try again or ask for a new link.");
        return;
      }

      const { redirectTo } = await finalizeAuthCallback({
        inviteToken: params.get("invite_token"),
        redirectPath: params.get("next"),
      });
      router.refresh();
      router.replace(redirectTo);
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong completing sign-in. Ask the admin for a fresh link.");
    }
  }

  if (status === "working") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-lime" />
        <p className="text-sm text-text-muted">Signing you in…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-destructive max-w-sm">{errorMessage}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.replace("/login")}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  if (needsClick && tokenHash) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center max-w-sm mx-auto">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-text-muted uppercase mb-2">
            {LEAGUE_NAME}
          </p>
          <h1 className="text-xl font-bold">Complete setup</h1>
          <p className="text-sm text-text-muted mt-2">
            Tap the button below to finish signing in. This stops email / chat
            apps from using up your one-time link before you open it.
          </p>
        </div>
        <Button
          type="button"
          className="bg-lime text-background hover:bg-lime-muted w-full"
          onClick={() =>
            void completeSignIn({ tokenHash, typeHint })
          }
        >
          Continue to {LEAGUE_NAME}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-text-muted">Preparing sign-in…</p>
    </div>
  );
}
