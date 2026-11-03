"use server";

import { requireUser } from "@/lib/auth/session";
import { extractJobPosting, JobImportError, type JobImportResult } from "@/lib/job-import";
import { consumeRateLimit } from "@/lib/rate-limit";

export type JobImportActionState =
  | { ok: true; result: JobImportResult }
  | { ok: false; error: string };

export async function autofillFromJobUrlAction(rawUrl: string): Promise<JobImportActionState> {
  const user = await requireUser();
  const rateLimit = await consumeRateLimit(`autofill:user:${user.id}`, 30, 60 * 60);
  if (!rateLimit.allowed) {
    return { ok: false, error: "You've imported a lot of links. Try again later." };
  }

  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return { ok: false, error: "Paste a job link first." };
  }

  try {
    const result = await extractJobPosting(rawUrl);
    return { ok: true, result };
  } catch (error) {
    if (error instanceof JobImportError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "We couldn't read that job page. Enter the details manually." };
  }
}
