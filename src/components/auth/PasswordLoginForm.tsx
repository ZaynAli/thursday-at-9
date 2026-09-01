"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signInWithPasswordAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEAGUE_NAME } from "@/lib/constants";

interface PasswordLoginFormProps {
  redirectTo?: string;
}

export function PasswordLoginForm({ redirectTo = "/" }: PasswordLoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !email.includes("@")) {
      setError("Enter a valid email address.");
      setPending(false);
      return;
    }

    if (!password) {
      setError("Enter your password.");
      setPending(false);
      return;
    }

    const result = await signInWithPasswordAction(email, password, redirectTo);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-lime uppercase">
          {LEAGUE_NAME}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="text-sm text-text-muted">
          Use the email and password you set up with your manager invite.
        </p>
      </div>

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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
            disabled={pending}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-lime text-background hover:bg-lime-muted"
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-text-muted">
        First time? Open your manager invite link from the admin, then choose a
        password. Roster-only players don&apos;t need an account.{" "}
        <Link href="/" className="text-lime hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
