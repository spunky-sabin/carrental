import { NextResponse } from "next/server";
import { getOwnerDashboardData, requireOwnerUser } from "@/lib/owner";

export async function GET() {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const data = await getOwnerDashboardData(access.user.userId);
  return NextResponse.json({ bookings: data.bookings });
}
