import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session?.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const bookingId = Number(id);

  // Update booking status
  const result = await query(
    `UPDATE bookings 
     SET booking_status = 'ACTIVE', pickup_confirmed_at = NOW() 
     WHERE id = $1 AND renter_id = $2 AND booking_status = 'HANDOVER_PENDING'
     RETURNING id, car_id`,
    [bookingId, session.userId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json(
      { error: "Booking not found or not in handover pending state." },
      { status: 400 }
    );
  }

  const carId = result.rows[0].car_id as number;
  await query("UPDATE cars SET status = 'booked' WHERE id = $1", [carId]);

  return NextResponse.json({ message: "Handover accepted. Rental is now active." });
}
