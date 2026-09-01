import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const isLocalDev =
    process.env.NODE_ENV === "development" &&
    (siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1"));

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="space-y-4">
        {errorMessage && (
          <p className="text-sm text-destructive text-center max-w-sm">
            {errorMessage}
          </p>
        )}
        <LoginForm redirectTo={redirectTo} isLocalDev={isLocalDev} />
      </div>
    </div>
  );
}
