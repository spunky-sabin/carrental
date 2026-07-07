import { NextResponse } from "next/server";
import { getOwnerApplications, requireAdminUser } from "@/lib/owner";

export async function GET() {
  const access = await requireAdminUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const applications = await getOwnerApplications();
  return NextResponse.json({ applications });
}
