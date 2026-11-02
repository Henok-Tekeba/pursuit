import { STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { CalendarFollowUp } from "@/lib/queries/calendar";

function escapeIcs(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\n")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function foldLine(line: string) {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  for (let index = 0; index < line.length; index += 73) {
    chunks.push(line.slice(index, index + 73));
  }
  return chunks.join("\r\n ");
}

function dateOnly(value: string) {
  return value.replaceAll("-", "");
}

function utcStamp(value = new Date()) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildCalendarIcs(events: CalendarFollowUp[], appUrl: string) {
  let host = "pursuit.enoch.et";
  try {
    host = new URL(appUrl).hostname;
  } catch {
    // Keep the production host as a stable UID fallback.
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pursuit//Follow-ups//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Pursuit follow-ups",
    "X-WR-CALDESC:Follow-ups from your Pursuit workspace.",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];

  for (const event of events) {
    const url = new URL(`/applications/${event.id}`, appUrl).toString();
    const date = dateOnly(event.nextFollowUpAt);
    const summary = `Follow up with ${event.companyName}`;
    const description = [
      `Role: ${event.position}`,
      `Status: ${STATUS_LABELS[event.status]}`,
      `Applied: ${formatDate(event.appliedAt)}`,
      event.lastContactAt ? `Last contact: ${formatDate(event.lastContactAt)}` : "Last contact: Not recorded",
      "",
      `Open in Pursuit: ${url}`,
    ].join("\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:pursuit-follow-up-${event.id}@${host}`,
      `DTSTAMP:${utcStamp()}`,
      `DTSTART:${date}T090000`,
      `DTEND:${date}T093000`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `URL:${escapeIcs(url)}`,
      "STATUS:CONFIRMED",
      "TRANSP:TRANSPARENT",
      "CATEGORIES:Internship",
      "BEGIN:VALARM",
      "TRIGGER:-PT15M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcs(summary)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
