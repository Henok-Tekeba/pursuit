import { NextRequest, NextResponse } from "next/server";
import { findOrCreateUser } from "@/lib/auth/helpers";
import { setSessionCookie } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/url";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeRedirectPath(url.searchParams.get("next"), "/dashboard");

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/login?error=missing-code", request.url));
  }

  try {
    const supabase = await createSupabaseServerClient();
    let email: string | null = null;
    let fullName: string | undefined;

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.user?.email) {
        console.error("Supabase code exchange failed", error);
        return NextResponse.redirect(new URL("/login?error=auth-failed", request.url));
      }
      email = data.user.email;
      fullName = (data.user.user_metadata?.full_name as string | undefined) ?? undefined;
    } else if (tokenHash) {
      const { data, error } = await supabase.auth.verifyOtp({
        type: (type as "email" | "magiclink") ?? "magiclink",
        token_hash: tokenHash,
      });
      if (error || !data.user?.email) {
        return NextResponse.redirect(new URL("/login?error=auth-failed", request.url));
      }
      email = data.user.email;
      fullName = (data.user.user_metadata?.full_name as string | undefined) ?? undefined;
    }

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=auth-failed", request.url));
    }

    const user = await findOrCreateUser(email, fullName);
    await setSessionCookie(user.id, user.email);
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error("Auth callback failed", error);
    return NextResponse.redirect(new URL("/login?error=auth-failed", request.url));
  }
}
