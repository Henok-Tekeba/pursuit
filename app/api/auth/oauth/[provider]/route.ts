import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth/helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

const ALLOWED_PROVIDERS = new Set(["google", "apple"]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  if (!ALLOWED_PROVIDERS.has(provider) || !isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=oauth-unavailable", request.url));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const baseUrl = await getRequestBaseUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as "google" | "apple",
      options: {
        redirectTo: `${baseUrl}/auth/callback?next=/dashboard`,
        queryParams: provider === "google" ? { access_type: "offline", prompt: "consent" } : undefined,
      },
    });

    if (error || !data.url) {
      console.error("OAuth start failed", error);
      return NextResponse.redirect(new URL("/login?error=oauth-failed", request.url));
    }
    return NextResponse.redirect(data.url);
  } catch (error) {
    console.error("OAuth route failed", error);
    return NextResponse.redirect(new URL("/login?error=oauth-failed", request.url));
  }
}
