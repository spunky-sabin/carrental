import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { addNotification, ensureOwnerSchema, normalizeBookingStatus } from "@/lib/owner";

// POST /api/bookings/[id]/signal-return
// User signals they are ready to return the vehicle (ACTIVE → RETURN_REQUESTED)
export async function POST(
  _request: Request,
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
      owner_id: number;
      brand: string;
      model: string;
      return_date: string;
    }>(
      `SELECT b.id, b.renter_id, b.car_id, b.booking_status, b.return_date,
              c.owner_id, c.brand, c.model
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingResult.rows[0];

    if (String(booking.renter_id) !== String(session.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const status = normalizeBookingStatus(booking.booking_status);
    if (status !== "ACTIVE") {
      return NextResponse.json(
        { error: "You can only signal return on an active rental." },
        { status: 400 }
      );
    }

    // Transition to RETURN_REQUESTED
    await query(
      "UPDATE bookings SET booking_status = 'RETURN_REQUESTED' WHERE id = $1",
      [bookingId]
    );

    // Notify owner
    await addNotification(
      booking.owner_id,
      "Return signal received",
      `${booking.brand} ${booking.model} renter has signalled they are ready to return the vehicle. Please coordinate pickup.`,
      "Vehicle Return Due"
    );

    return NextResponse.json({ message: "Return signal sent to owner successfully." });
  } catch (error) {
    console.error("Signal return error:", error);
    return NextResponse.json({ error: "Failed to signal return" }, { status: 500 });
  }
}
