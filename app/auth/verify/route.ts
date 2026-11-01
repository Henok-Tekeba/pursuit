import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLink, findOrCreateUser } from "@/lib/auth/helpers";
import { setSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", request.url));
  }

  const email = await consumeMagicLink(token);
  if (!email) {
    return NextResponse.redirect(new URL("/login?error=expired-link", request.url));
  }

  const user = await findOrCreateUser(email);
  await setSessionCookie(user.id, user.email);
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
