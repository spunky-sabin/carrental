import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { addNotification, ensureOwnerSchema } from "@/lib/owner";

export async function GET(request: Request) {
  try {
    await ensureOwnerSchema();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("booking_id");
    const carId = searchParams.get("car_id");
    const origin = new URL(request.url).origin;

    if (!bookingId) {
      return NextResponse.redirect(`${origin}/browse?error=invalid_booking`);
    }

    const numericBookingId = Number(bookingId);

    // Fetch booking
    const bookingResult = await query<{
      id: number;
      renter_id: number;
      car_id: number;
      total_amount: string;
      booking_status: string;
      owner_id: number;
      brand: string;
      model: string;
    }>(
      `SELECT b.id, b.renter_id, b.car_id, b.total_amount, b.booking_status,
              c.owner_id, c.brand, c.model
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       WHERE b.id = $1`,
      [numericBookingId]
    );

    if (bookingResult.rows.length === 0) {
      return NextResponse.redirect(`${origin}/browse?error=booking_not_found`);
    }

    const booking = bookingResult.rows[0];

    // If booking is not already confirmed/paid, confirm it now
    if (booking.booking_status.toUpperCase() === "PAYMENT_PENDING") {
      const amount = Number(booking.total_amount);

      // Find or create payment method
      const pmResult = await query<{ id: number }>(
        "SELECT id FROM payment_methods WHERE user_id = $1 LIMIT 1",
        [booking.renter_id]
      );
      let pmId = 1;
      if (pmResult.rows.length > 0) {
        pmId = pmResult.rows[0].id;
      } else {
        const newPm = await query<{ id: number }>(
          "INSERT INTO payment_methods (name, user_id, provider, is_default, is_active) VALUES ('PayBridge Wallet', $1, 'paybridge', true, true) RETURNING id",
          [booking.renter_id]
        );
        pmId = newPm.rows[0].id;
      }

      // Record payment
      await query(
        `INSERT INTO payments (booking_id, payment_method_id, amount, payment_status, paid_at, transaction_reference)
         VALUES ($1, $2, $3, 'paid', NOW(), $4)`,
        [numericBookingId, pmId, amount, `PAYBRIDGE_TX_${Date.now()}`]
      );

      // Update booking status to CONFIRMED
      await query("UPDATE bookings SET booking_status = 'CONFIRMED' WHERE id = $1", [numericBookingId]);

      // Add notifications
      await addNotification(
        booking.owner_id,
        "New booking request",
        `${booking.brand} ${booking.model} has a paid booking request awaiting your acceptance.`,
        "Booking Request"
      );
      await addNotification(
        booking.renter_id,
        "Payment received",
        "Your payment via PayBridge NP was received. The owner will now review your booking request.",
        "Payment Received"
      );
    }

    const redirectCarId = carId || booking.car_id;
    return NextResponse.redirect(`${origin}/browse/${redirectCarId}?payment=success&booking_id=${numericBookingId}`);

  } catch (error) {
    console.error("Payment callback processing error:", error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/browse?error=payment_failed`);
  }
}
