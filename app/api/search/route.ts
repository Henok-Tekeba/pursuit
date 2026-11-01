import { NextRequest, NextResponse } from "next/server";
import { searchApplications } from "@/lib/queries/applications";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchApplications(user.id, query);
  return NextResponse.json({
    results: results.map((item) => ({
      id: item.id,
      reference: item.reference,
      companyName: item.companyName,
      position: item.position,
      contactName: item.contactName,
      status: item.status,
    })),
  });
}
