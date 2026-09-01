"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, Loader2, Link2, Copy, Check } from "lucide-react";
import {
  generateDevMagicLinkAction,
  setAuthRedirectCookies,
  type SignInState,
} from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEAGUE_NAME } from "@/lib/constants";

interface LoginFormProps {
  redirectTo?: string;
  inviteToken?: string;
  title?: string;
  description?: string;
  playerName?: string;
  /** Show local-dev guidance when magic links only work on this machine. */
  isLocalDev?: boolean;
}

export function LoginForm({
  redirectTo = "/",
  inviteToken,
  title = "Sign in",
  description = "We'll email you a magic link — no password needed.",
  playerName,
  isLocalDev = false,
}: LoginFormProps) {
  const [state, setState] = useState<SignInState>({ status: "idle" });
  const [pending, setPending] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [devLinkError, setDevLinkError] = useState<string | null>(null);
  const [devLinkPending, setDevLinkPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState({ status: "idle" });
    setDevLink(null);
    setDevLinkError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    if (!email || !email.includes("@")) {
      setState({ status: "error", message: "Enter a valid email address." });
      setPending(false);
      return;
    }

    setEmailValue(email);

    try {
      await setAuthRedirectCookies(redirectTo, inviteToken);

      const supabase = createClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });

      if (error) {
        const isRateLimit = error.message.toLowerCase().includes("rate limit");
        const message = isRateLimit
          ? "Email rate limit reached (~2/hour on Supabase free email). Use “Get sign-in link (no email)” below instead."
          : error.message;
        setState({ status: "error", message });
      } else {
        setState({ status: "success", email });
      }
    } catch {
      setState({
        status: "error",
        message: "Could not send magic link. Try again.",
      });
    } finally {
      setPending(false);
    }
  }

  async function handleDevLink() {
    const email = emailValue.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setDevLinkError("Enter your email above first.");
      return;
    }

    setDevLinkPending(true);
    setDevLinkError(null);
    setDevLink(null);

    const result = await generateDevMagicLinkAction(email, redirectTo, inviteToken);
    setDevLinkPending(false);

    if (!result.ok) {
      setDevLinkError(result.error);
      return;
    }

    setDevLink(result.link);
  }

  async function copyDevLink() {
    if (!devLink) return;
    await navigator.clipboard.writeText(devLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-lime uppercase">
          {LEAGUE_NAME}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-text-muted">{description}</p>
        {playerName && (
          <p className="text-sm text-text-secondary">
            Joining as roster player{" "}
            <span className="font-medium text-foreground">{playerName}</span>
          </p>
        )}
      </div>

      {isLocalDev && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-text-secondary space-y-1">
          <p className="font-medium text-amber-200/90">Local dev mode</p>
          <p>
            Open generated links on <strong>this Mac</strong> while{" "}
            <code className="text-foreground">npm run dev</code> is running.
          </p>
        </div>
      )}

      {state.status === "success" ? (
        <div className="rounded-lg border border-lime/30 bg-lime/5 p-4 text-center space-y-2">
          <Mail className="h-8 w-8 text-lime mx-auto" />
          <p className="text-sm font-medium">Check your email</p>
          <p className="text-xs text-text-muted">
            We sent a sign-in link to{" "}
            <span className="text-foreground">{state.email}</span>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={pending}
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
            />
          </div>

          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-lime text-background hover:bg-lime-muted"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending link…
              </>
            ) : (
              "Send magic link"
            )}
          </Button>
        </form>
      )}

      {isLocalDev && state.status !== "success" && (
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-xs text-text-muted text-center">
            Hit email rate limit? Skip email entirely:
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => void handleDevLink()}
            disabled={devLinkPending || pending}
          >
            {devLinkPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            Get sign-in link (no email)
          </Button>
          {devLinkError && (
            <p className="text-sm text-destructive">{devLinkError}</p>
          )}
          {devLink && (
            <div className="space-y-2">
              <div className="rounded-lg bg-surface border border-border p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                  Dev sign-in link
                </p>
                <p className="text-xs text-text-secondary break-all font-mono">
                  {devLink}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => void copyDevLink()}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-lime" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy link"}
              </Button>
              <Button
                type="button"
                size="sm"
                className="w-full bg-lime text-background hover:bg-lime-muted"
                onClick={() => {
                  window.location.href = devLink;
                }}
              >
                Open sign-in link
              </Button>
              {inviteToken && (
                <p className="text-xs text-text-muted text-center">
                  Invite will be accepted automatically after sign-in.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!inviteToken && (
        <p className="text-center text-xs text-text-muted">
          Roster-only players don&apos;t need an account.{" "}
          <Link href="/" className="text-lime hover:underline">
            Back to home
          </Link>
        </p>
      )}
    </div>
  );
}
