import { AuthCallbackClient } from "@/app/auth/callback/AuthCallbackClient";

/**
 * Magic-link / OTP landing page.
 *
 * Must be a page (not a route handler with rewrite). Rewrites from App Router
 * route handlers are unsupported and 500 on Vercel production.
 *
 * One-time tokens are verified only after the user taps Continue — that avoids
 * email/chat link previews burning the OTP on open.
 */
export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}
