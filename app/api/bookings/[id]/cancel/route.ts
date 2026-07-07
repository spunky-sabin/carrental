import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ensureOwnerSchema, normalizeBookingStatus } from "@/lib/owner";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureOwnerSchema();
    const session = await getSessionUser();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = Number(id);

    const bookingResult = await query<{
      id: number;
      renter_id: number;
      car_id: number;
      booking_status: string;
    }>(
      "SELECT id, renter_id, car_id, booking_status FROM bookings WHERE id = $1 FOR UPDATE",
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingResult.rows[0];

    if (String(booking.renter_id) !== String(session.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (normalizeBookingStatus(booking.booking_status) !== "PAYMENT_PENDING") {
      return NextResponse.json({ error: "Only pending payments can be cancelled" }, { status: 400 });
    }

    // Cancel booking and release car
    await query(
      `UPDATE bookings
       SET booking_status = 'CANCELLED',
           cancelled_at = NOW(),
           cancelled_by = 'renter',
           cancellation_reason = 'Payment cancelled before confirmation.'
       WHERE id = $1`,
      [bookingId]
    );
    await query("UPDATE cars SET status = 'available' WHERE id = $1", [booking.car_id]);

    return NextResponse.json({ success: true, message: "Booking cancelled and car released" }, { status: 200 });

  } catch (error) {
    console.error("Booking cancellation error:", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
