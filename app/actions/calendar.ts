"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { regenerateCalendarToken } from "@/lib/calendar";
import { getRequestBaseUrl } from "@/lib/url";

export async function regenerateCalendarFeedAction(): Promise<{
  ok: boolean;
  message?: string;
  feedUrl?: string;
}> {
  const user = await requireUser();
  if (user.isDemo) {
    return { ok: false, message: "Calendar feeds are not available in the demo workspace." };
  }

  try {
    const token = await regenerateCalendarToken(user.id);
    const baseUrl = await getRequestBaseUrl();
    revalidatePath("/settings");
    return { ok: true, feedUrl: `${baseUrl}/api/calendar/${token}.ics` };
  } catch {
    return { ok: false, message: "Could not regenerate the calendar link." };
  }
}
