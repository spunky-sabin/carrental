import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { addNotification, ensureOwnerSchema, normalizeBookingStatus } from "@/lib/owner";

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

    // Verify booking belongs to user and is payment_pending
    const bookingResult = await query<{
      id: number;
      renter_id: number;
      car_id: number;
      total_amount: string;
      booking_status: string;
      reservation_expires_at: string | null;
      expires_at: string | null;
      owner_id: number;
      brand: string;
      model: string;
    }>(
      `SELECT b.id, b.renter_id, b.car_id, b.total_amount, b.booking_status, b.reservation_expires_at, b.expires_at,
              c.owner_id, c.brand, c.model
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       WHERE b.id = $1
       FOR UPDATE`,
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
      return NextResponse.json({ error: "Booking is not pending payment" }, { status: 400 });
    }

    // Check expiry
    const now = new Date();
    const expiresAt = new Date(booking.expires_at || booking.reservation_expires_at || Date.now());

    if (now > expiresAt) {
      // Auto-cancel if expired
      await query(
        `UPDATE bookings
         SET booking_status = 'EXPIRED',
             cancelled_at = NOW(),
             cancelled_by = 'system',
             cancellation_reason = 'Reservation time expired before payment.'
         WHERE id = $1`,
        [bookingId]
      );
      await query("UPDATE cars SET status = 'available' WHERE id = $1", [booking.car_id]);
      
      return NextResponse.json({ error: "Reservation time expired. Booking cancelled." }, { status: 400 });
    }

    // Since we don't have a real payment gateway, we just insert a dummy payment record
    const amount = Number(booking.total_amount);
    
    // We need a payment_method_id. Let's find one or use a dummy value if none exist.
    // For this simulation, we'll assume a dummy record or just insert without one if not strict foreign key.
    // Actually, payment_methods is linked, so we'll need to mock it. Let's just create a dummy one if it doesn't exist.
    const pmResult = await query<{ id: number }>("SELECT id FROM payment_methods WHERE user_id = $1 LIMIT 1", [session.userId]);
    let pmId = 1; // Default fallback
    if (pmResult.rows.length > 0) {
      pmId = pmResult.rows[0].id;
    } else {
      const newPm = await query<{ id: number }>(
        "INSERT INTO payment_methods (name, user_id, provider, is_default, is_active) VALUES ('Mock Card', $1, 'mock_card', true, true) RETURNING id",
        [session.userId]
      );
      pmId = newPm.rows[0].id;
    }

    // Record payment
    await query(
      `INSERT INTO payments (booking_id, payment_method_id, amount, payment_status, paid_at, transaction_reference)
       VALUES ($1, $2, $3, 'paid', NOW(), $4)`,
      [bookingId, pmId, amount, `MOCK_TX_${Date.now()}`]
    );

    // Update booking status. Owners must still accept/reject this paid request.
    await query("UPDATE bookings SET booking_status = 'CONFIRMED' WHERE id = $1", [bookingId]);
    await addNotification(booking.owner_id, "New booking request", `${booking.brand} ${booking.model} has a paid booking request awaiting your acceptance.`, "Booking Request");
    await addNotification(session.userId, "Payment received", "Your payment was received. The owner will now review your booking request.", "Payment Received");

    return NextResponse.json({ success: true, message: "Payment confirmed. Booking sent to owner for acceptance." }, { status: 200 });

  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 });
  }
}
