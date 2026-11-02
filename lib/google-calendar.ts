import { STATUS_LABELS } from "@/lib/constants";
import type { CalendarFollowUp } from "@/lib/queries/calendar";
import { APP_TIMEZONE, formatDate } from "@/lib/utils";

export function buildGoogleCalendarUrl(event: CalendarFollowUp, appUrl: string) {
  const date = event.nextFollowUpAt.replaceAll("-", "");
  const applicationUrl = new URL(`/applications/${event.id}`, appUrl).toString();
  const details = [
    `Role: ${event.position}`,
    `Follow-up: ${formatDate(event.nextFollowUpAt)}`,
    `Status: ${STATUS_LABELS[event.status]}`,
    "",
    `Open in Pursuit: ${applicationUrl}`,
  ].join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Follow up with ${event.companyName}`,
    dates: `${date}T090000/${date}T093000`,
    details,
    ctz: APP_TIMEZONE,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
