import { redirect } from "next/navigation";
import { PasswordLoginForm } from "@/components/auth/PasswordLoginForm";
import { userNeedsPasswordSetup } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data";
import { useMockData } from "@/lib/data/config";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const redirectTo = params.next?.startsWith("/") ? params.next : "/";

  if (user && !useMockData()) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser && userNeedsPasswordSetup(authUser)) {
      redirect(`/login/set-password?next=${encodeURIComponent(redirectTo)}`);
    }

    redirect(redirectTo);
  }

  if (user) {
    redirect(redirectTo);
  }

  const errorMessage =
    params.error === "auth"
      ? "Setup link expired or invalid. Ask the admin for a fresh link (and open it yourself — don’t let chat apps preview it first)."
      : params.error === "missing_code"
        ? "Sign-in could not be completed. Open your manager invite link again, or ask the admin for a fresh setup link."
        : undefined;

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="space-y-4">
        {errorMessage && (
          <p className="text-sm text-destructive text-center max-w-sm">
            {errorMessage}
          </p>
        )}
        <PasswordLoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
