import { getAdminUser } from "@/lib/auth/admin";
import { getAdminOverview } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

function csvCell(value: string | null | undefined) {
  const raw = value ?? "";
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function isoOrEmpty(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const { users } = await getAdminOverview({ userLimit: 5000 });
  const lines = [
    ["Email", "Name", "Joined", "Onboarded", "Applications", "Last activity"],
    ...users.map((user) => [
      user.email,
      user.name,
      user.createdAt.toISOString(),
      user.onboardedAt ? "yes" : "no",
      String(user.applicationCount),
      isoOrEmpty(user.lastActiveAt),
    ]),
  ];
  const csv = `\uFEFF${lines.map((line) => line.map(csvCell).join(",")).join("\r\n")}\r\n`;
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pursuit-signups-${date}.csv"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
