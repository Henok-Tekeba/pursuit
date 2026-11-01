import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  await clearSessionCookie();
  const requested = new URL(request.url).searchParams.get("next");
  const destination = requested === "/signup" ? "/signup" : "/login";
  return NextResponse.redirect(new URL(destination, request.url), 303);
}
