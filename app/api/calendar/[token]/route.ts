import { NextResponse } from "next/server";
import { getUserForCalendarToken } from "@/lib/calendar";
import { buildCalendarIcs } from "@/lib/calendar-ics";
import { getCalendarFollowUps } from "@/lib/queries/calendar";
import { getRequestBaseUrl } from "@/lib/url";

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
