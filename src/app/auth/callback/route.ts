import { type NextRequest, NextResponse } from "next/server";

/**
 * Auth callback entrypoint.
 *
 * One-time `token_hash` links must NOT be verified on a bare GET — email
 * scanners, iMessage/Slack previews, and antivirus link checkers will hit the
 * URL first and burn the OTP, so the real user then sees "expired".
 *
 * Always rewrite to the client confirmation page, which verifies only after an
 * explicit button click (or handles PKCE `code` / hash tokens there).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  // Preserve query string (token_hash, type, code, invite_token, next).
  const clientUrl = new URL("/auth/callback/client", request.url);
  searchParams.forEach((value, key) => {
    clientUrl.searchParams.set(key, value);
  });

  return NextResponse.rewrite(clientUrl);
}
