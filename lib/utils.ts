import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  addDays,
  differenceInCalendarDays,
  formatDistanceToNowStrict,
  isValid,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { ApplicationStatus } from "@/lib/db/schema";
import { ACTIVE_STATUSES, INTERVIEW_STATUSES, RESPONSE_STATUSES } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || "UTC";

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
}

function dateKey(value: string | Date): string {
  if (typeof value === "string" && value.length === 10) return value.slice(0, 10);
  return formatInTimeZone(toDate(value), APP_TIMEZONE, "yyyy-MM-dd");
}

export function toDateOnly(date: Date | string): string {
  if (typeof date === "string") return date.slice(0, 10);
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd");
}

export function parseDateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00Z`);
}

export function todayDateOnly(): string {
  return formatInTimeZone(new Date(), APP_TIMEZONE, "yyyy-MM-dd");
}

export function formatDate(value: string | Date | null | undefined, pattern = "MMM d, yyyy") {
  if (!value) return "N/A";
  const date = toDate(value);
  if (!isValid(date)) return "N/A";
  return formatInTimeZone(date, APP_TIMEZONE, pattern);
}

export function formatDateWithTime(value: string | Date | null | undefined) {
  if (!value) return "N/A";
  const date = toDate(value);
  if (!isValid(date)) return "N/A";
  return formatInTimeZone(date, APP_TIMEZONE, "MMM d, yyyy 'at' h:mm a");
}

export function formatTime(value: string | Date | null | undefined) {
  if (!value) return "N/A";
  const date = toDate(value);
  if (!isValid(date)) return "N/A";
  return formatInTimeZone(date, APP_TIMEZONE, "h:mm a");
}

export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return "N/A";
  const date = toDate(value);
  if (!isValid(date)) return "N/A";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function daysSince(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  return Math.max(0, differenceInCalendarDays(parseDateOnly(todayDateOnly()), parseDateOnly(dateKey(value))));
}

export function daysUntil(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  return differenceInCalendarDays(parseDateOnly(dateKey(value)), parseDateOnly(todayDateOnly()));
}

export function calendarDaysBetween(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
): number | null {
  if (!start || !end) return null;
  return differenceInCalendarDays(parseDateOnly(dateKey(end)), parseDateOnly(dateKey(start)));
}

export function isOverdue(value: string | Date | null | undefined): boolean {
  const remaining = daysUntil(value);
  return remaining !== null && remaining < 0;
}

export function getFirstFollowUpDate(appliedAt: string, intervals: number[], today = todayDateOnly()) {
  const base = parseDateOnly(appliedAt);
  const todayDate = parseDateOnly(today);
  const sorted = [...new Set(intervals.filter((n) => Number.isFinite(n) && n > 0))].sort((a, b) => a - b);
  const candidates = sorted.map((days) => addDays(base, days));
  const upcoming = candidates.find((date) => differenceInCalendarDays(date, todayDate) >= 0);
  if (upcoming) return toDateOnly(upcoming);
  const last = candidates.at(-1);
  return last ? toDateOnly(last) : null;
}

export function getNextFollowUpDate(
  appliedAt: string,
  intervals: number[],
  after: string = todayDateOnly(),
) {
  const base = parseDateOnly(appliedAt);
  const afterDate = parseDateOnly(after);
  const sorted = [...new Set(intervals.filter((n) => Number.isFinite(n) && n > 0))].sort((a, b) => a - b);
  const candidates = sorted.map((days) => addDays(base, days));
  const upcoming = candidates.find((date) => differenceInCalendarDays(date, afterDate) > 0);
  return upcoming ? toDateOnly(upcoming) : null;
}

export function followUpDueState(date: string | null | undefined) {
  if (!date) return "none" as const;
  const days = daysUntil(date);
  if (days === null) return "none" as const;
  if (days < 0) return "overdue" as const;
  if (days === 0) return "today" as const;
  return "upcoming" as const;
}

export function isActiveStatus(status: ApplicationStatus) {
  return ACTIVE_STATUSES.includes(status);
}

export function isResponseStatus(status: ApplicationStatus) {
  return RESPONSE_STATUSES.includes(status);
}

export function isInterviewStatus(status: ApplicationStatus) {
  return INTERVIEW_STATUSES.includes(status);
}

export function formatDays(value: number | null) {
  if (value === null) return "N/A";
  if (value === 0) return "Today";
  if (value === 1) return "1 day";
  return `${value} days`;
}

export function getFollowUpLabel(date: string | null | undefined) {
  if (!date) return "Not scheduled";
  const remaining = daysUntil(date);
  if (remaining === null) return "Not scheduled";
  if (remaining < 0) {
    const overdue = Math.abs(remaining);
    return `${overdue} ${overdue === 1 ? "day" : "days"} overdue`;
  }
  if (remaining === 0) return "Due today";
  if (remaining === 1) return "Due tomorrow";
  return `Due in ${remaining} days`;
}

export function resolveTemplate(
  content: string,
  vars: { company?: string | null; position?: string | null; contactName?: string | null; myName?: string | null; email?: string | null },
) {
  return content
    .replaceAll("{{company}}", vars.company ?? "the company")
    .replaceAll("{{position}}", vars.position ?? "this role")
    .replaceAll("{{contactName}}", vars.contactName || "there")
    .replaceAll("{{myName}}", vars.myName ?? "")
    .replaceAll("{{email}}", vars.email ?? "");
}

export function initialsFor(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
