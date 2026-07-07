import { NextResponse } from "next/server";
import { getOwnerDashboardData, requireOwnerUser } from "@/lib/owner";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const data = await getOwnerDashboardData(access.user.userId);
  const booking = data.bookings.find((item) => item.id === Number(id));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
