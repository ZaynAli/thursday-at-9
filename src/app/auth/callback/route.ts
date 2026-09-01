import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { resolveAuthCallbackRedirect } from "@/lib/auth/finalize-callback";
import {
  AUTH_INVITE_COOKIE,
  AUTH_REDIRECT_COOKIE,
} from "@/lib/auth/pending-redirect";
import { getSupabaseEnv } from "@/lib/supabase/env";

function createSupabaseRouteClient(
  request: NextRequest,
  response: NextResponse
) {
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
}

function clearPendingAuthCookies(response: NextResponse) {
  response.cookies.delete(AUTH_REDIRECT_COOKIE);
  response.cookies.delete(AUTH_INVITE_COOKIE);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  if (code || (tokenHash && type)) {
    const redirectPath = request.cookies.get(AUTH_REDIRECT_COOKIE)?.value;
    const inviteToken = request.cookies.get(AUTH_INVITE_COOKIE)?.value;

    const cookieResponse = NextResponse.redirect(new URL("/", request.url));
    const supabase = createSupabaseRouteClient(request, cookieResponse);

    if (code) {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        return NextResponse.redirect(new URL("/login?error=auth", request.url));
      }
    } else {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: type as EmailOtpType,
      });
      if (verifyError) {
        return NextResponse.redirect(new URL("/login?error=auth", request.url));
      }
    }

    const destination = await resolveAuthCallbackRedirect({
      supabase,
      redirectPath,
      inviteToken,
    });

    const response = NextResponse.redirect(new URL(destination, request.url));
    copyCookies(cookieResponse, response);
    clearPendingAuthCookies(response);

    return response;
  }

  return NextResponse.rewrite(new URL("/auth/callback/client", request.url));
}
