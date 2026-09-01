import { redirect } from "next/navigation";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { userNeedsPasswordSetup } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/server";
import { useMockData } from "@/lib/data/config";

interface SetPasswordPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SetPasswordPage({ searchParams }: SetPasswordPageProps) {
  if (useMockData()) {
    redirect("/login");
  }

  const params = await searchParams;
  const redirectTo = params.next?.startsWith("/") ? params.next : "/";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!userNeedsPasswordSetup(user)) {
    redirect(redirectTo);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <SetPasswordForm redirectTo={redirectTo} />
    </div>
  );
}
