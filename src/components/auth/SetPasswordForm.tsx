"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { setPasswordAction } from "@/lib/auth/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEAGUE_NAME } from "@/lib/constants";

interface SetPasswordFormProps {
  redirectTo?: string;
}

export function SetPasswordForm({ redirectTo = "/" }: SetPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");

    if (password !== confirm) {
      setError("Passwords do not match.");
      setPending(false);
      return;
    }

    const result = await setPasswordAction(password, redirectTo);
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
        <h1 className="text-2xl font-bold tracking-tight">Choose a password</h1>
        <p className="text-sm text-text-muted">
          You&apos;ll use this email and password to sign in next time — no more
          magic links.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            required
            minLength={MIN_PASSWORD_LENGTH}
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            required
            minLength={MIN_PASSWORD_LENGTH}
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
              Saving…
            </>
          ) : (
            "Save password"
          )}
        </Button>
      </form>
    </div>
  );
}
