import { NextResponse } from "next/server";
import { getUserForCalendarToken } from "@/lib/calendar";
import { buildCalendarIcs } from "@/lib/calendar-ics";
import { getCalendarFollowUps } from "@/lib/queries/calendar";
import { getRequestBaseUrl } from "@/lib/url";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await params;
  const token = rawToken.replace(/\.ics$/i, "");
  const user = await getUserForCalendarToken(token);

  if (!user) {
    return new NextResponse("Calendar not found.", { status: 404 });
  }

  const ip = await getClientIp();
  const rateLimit = await consumeRateLimit(`calendar:${user.id}:${ip}`, 240, 60 * 60);
  if (!rateLimit.allowed) {
    return new NextResponse("Too many calendar requests. Try again later.", {
      status: 429,
      headers: { "Retry-After": "600" },
    });
  }

  const [events, appUrl] = await Promise.all([
    getCalendarFollowUps(user.id),
    getRequestBaseUrl(),
  ]);

  return new NextResponse(buildCalendarIcs(events, appUrl), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="pursuit-follow-ups.ics"',
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
