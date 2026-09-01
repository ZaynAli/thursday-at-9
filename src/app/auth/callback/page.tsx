import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { AuthCallbackClient } from "@/app/auth/callback/AuthCallbackClient";
import { finalizeAuthCallback } from "@/lib/auth/finalize-callback.server";
import { createClient } from "@/lib/supabase/server";

interface AuthCallbackPageProps {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>;
}

export default async function AuthCallbackPage({
  searchParams,
}: AuthCallbackPageProps) {
  const params = await searchParams;

  if (params.error) {
    redirect("/login?error=auth");
  }

  if (params.code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      redirect("/login?error=auth");
    }

    const { redirectTo } = await finalizeAuthCallback();
    redirect(redirectTo);
  }

  if (params.token_hash && params.type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type as EmailOtpType,
    });
    if (error) {
      redirect("/login?error=auth");
    }

    const { redirectTo } = await finalizeAuthCallback();
    redirect(redirectTo);
  }

  return <AuthCallbackClient />;
}
