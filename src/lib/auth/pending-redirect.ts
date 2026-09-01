export const AUTH_REDIRECT_COOKIE = "auth_redirect";
export const AUTH_INVITE_COOKIE = "auth_invite";

export function authPendingCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  };
}

export function sanitizeRedirectPath(path: string | undefined | null): string {
  if (!path?.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}
