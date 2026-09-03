import { headers } from "next/headers";

/**
 * Server-only site origin for magic links and invite URLs.
 * Set SITE_URL on Vercel (no NEXT_PUBLIC_ prefix).
 * NEXT_PUBLIC_SITE_URL is still read as a fallback for existing .env.local files.
 */
export function getConfiguredSiteUrl(): string | undefined {
  const siteUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  return siteUrl?.replace(/\/$/, "");
}

export function isLocalDevSite(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  const url = getConfiguredSiteUrl() ?? "";
  return (
    url === "" ||
    url.includes("localhost") ||
    url.includes("127.0.0.1")
  );
}

/** Origin for auth redirect URLs and invite links. Falls back to request host on Vercel. */
export async function getSiteUrl(): Promise<string> {
  const configured = getConfiguredSiteUrl();
  if (configured) return configured;

  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * Origin embedded in magic-link emails. On Vercel production, prefers
 * PRODUCTION_SITE_URL / SITE_URL so links never point at localhost.
 */
export async function resolveAuthEmailOrigin(): Promise<string> {
  const productionSiteUrl = process.env.PRODUCTION_SITE_URL?.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && productionSiteUrl) {
    return productionSiteUrl;
  }

  const configured = getConfiguredSiteUrl();
  if (configured && !isLocalOrigin(configured)) {
    return configured;
  }

  const requestOrigin = await getSiteUrl();
  if (!isLocalOrigin(requestOrigin)) {
    return requestOrigin;
  }

  if (productionSiteUrl) {
    return productionSiteUrl;
  }

  return requestOrigin;
}

export function buildAuthCallbackRedirectUrl(
  origin: string,
  options?: { inviteToken?: string; next?: string }
): string {
  const base = origin.replace(/\/$/, "");
  const params = new URLSearchParams();
  if (options?.inviteToken) {
    params.set("invite_token", options.inviteToken);
  }
  if (options?.next?.startsWith("/") && !options.next.startsWith("//")) {
    params.set("next", options.next);
  }
  const query = params.toString();
  return query ? `${base}/auth/callback?${query}` : `${base}/auth/callback`;
}
