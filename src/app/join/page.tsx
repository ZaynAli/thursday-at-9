import Link from "next/link";
import { InviteSetupForm } from "@/components/auth/InviteSetupForm";
import { isLocalDevSite } from "@/lib/auth/site-url";
import { getCurrentUser } from "@/lib/data";
import { fetchInviteByToken } from "@/lib/data/invites.server";
import { useMockData } from "@/lib/data/config";
import { redirect } from "next/navigation";

interface JoinPageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;
  const token = params.token?.trim();

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-xl font-bold">Invalid invite link</h1>
          <p className="text-sm text-text-muted">
            Ask the admin to send a new manager invite from your player page.
          </p>
          <Link href="/" className="text-sm text-lime hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (user?.isFantasyManager && user.playerId) {
    redirect("/");
  }

  if (useMockData()) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-xl font-bold">Manager invite</h1>
          <p className="text-sm text-text-muted">
            Invite acceptance requires Supabase. Configure{" "}
            <code className="text-xs">.env.local</code> and disable mock data.
          </p>
        </div>
      </div>
    );
  }

  const inviteData = await fetchInviteByToken(token);

  if (!inviteData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-xl font-bold">Invite not found</h1>
          <p className="text-sm text-text-muted">
            This link may be invalid or revoked. Ask the admin for a new one.
          </p>
        </div>
      </div>
    );
  }

  const { invite, playerName } = inviteData;

  if (invite.status !== "pending") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-xl font-bold">Invite already used</h1>
          <p className="text-sm text-text-muted">
            {invite.status === "accepted"
              ? "This manager invite was already accepted. Sign in to continue."
              : "This invite is no longer valid."}
          </p>
          <Link href="/login" className="text-sm text-lime hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (new Date(invite.expires_at) <= new Date()) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-xl font-bold">Invite expired</h1>
          <p className="text-sm text-text-muted">
            Ask the admin to send a fresh manager invite for {playerName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="space-y-4">
        {params.error && (
          <p className="text-sm text-destructive text-center max-w-sm">
            {params.error}
          </p>
        )}
        <InviteSetupForm
          inviteToken={token}
          redirectTo="/"
          isLocalDev={isLocalDevSite()}
          title="Accept manager invite"
          description="We'll email you a one-time link to verify your email. Then you'll choose a password for future sign-ins."
          playerName={playerName}
        />
      </div>
    </div>
  );
}
