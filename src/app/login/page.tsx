import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { isLocalDevSite } from "@/lib/auth/site-url";
import { getCurrentUser } from "@/lib/data";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const redirectTo = params.next?.startsWith("/") ? params.next : "/";

  if (user) {
    redirect(redirectTo);
  }

  const errorMessage =
    params.error === "auth"
      ? "Sign-in link expired or invalid. Request a new one."
      : params.error === "missing_code"
        ? "Sign-in could not be completed. Generate a fresh link with npm run auth:link -- your@email.com and open it on this Mac in any browser."
        : undefined;

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="space-y-4">
        {errorMessage && (
          <p className="text-sm text-destructive text-center max-w-sm">
            {errorMessage}
          </p>
        )}
        <LoginForm redirectTo={redirectTo} isLocalDev={isLocalDevSite()} />
      </div>
    </div>
  );
}
