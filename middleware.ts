import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/auth/admin-emails";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/token";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/applications",
  "/follow-ups",
  "/emails",
  "/templates",
  "/companies",
  "/analytics",
  "/settings",
  "/notifications",
  "/api/search",
  "/api/export",
  "/admin",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (session?.isDemo && isMutation && pathname !== "/api/auth/signout") {
    return NextResponse.json(
      { error: "The demo workspace is read-only. Create your own account to make changes." },
      { status: 403 },
    );
  }

  if (isProtected && !session) {
    const url = new URL("/login", request.url);
    if (pathname !== "/dashboard") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminPath && (!session || session.isDemo || !isAdminEmail(session.email))) {
    return new NextResponse("Not found", {
      status: 404,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const response = NextResponse.next();

  if (isAdminPath) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|avatars|.*\\..*).*)"],
};
