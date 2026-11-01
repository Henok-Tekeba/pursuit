import { isSupabaseConfigured } from "@/lib/auth/helpers";

export type SocialProviders = {
  google: boolean;
  apple: boolean;
};

export async function getSocialProviders(): Promise<SocialProviders> {
  if (!isSupabaseConfigured()) {
    return { google: false, apple: false };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { google: false, apple: false };
  }

  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return { google: false, apple: false };
    }

    const data = (await response.json()) as {
      external?: Record<string, boolean | undefined>;
    };

    return {
      google: Boolean(data.external?.google),
      apple: Boolean(data.external?.apple),
    };
  } catch {
    return { google: false, apple: false };
  }
}
