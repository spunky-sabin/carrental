import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureOwnerSchema, normalizeBookingStatus } from "@/lib/owner";

export async function GET(request: Request) {
  console.log("================ [Payment Cancel GET Request] ================");
  console.log("Full Request URL:", request.url);
  try {
    await ensureOwnerSchema();
    const { searchParams } = new URL(request.url);
    let bookingIdStr = searchParams.get("booking_id");
    let carIdStr = searchParams.get("car_id");
    const origin = new URL(request.url).origin;

    console.log("Cancel Params -> booking_id:", bookingIdStr, "car_id:", carIdStr);

    if (bookingIdStr) {
      const numericBookingId = Number(bookingIdStr);

      // Fetch booking
      const bookingResult = await query<{
        id: number;
        car_id: number;
        booking_status: string;
      }>(
        `SELECT id, car_id, booking_status FROM bookings WHERE id = $1`,
        [numericBookingId]
      );

      if (bookingResult.rows.length > 0) {
        const booking = bookingResult.rows[0];
        const targetCarId = carIdStr || booking.car_id;

        // If booking is still PAYMENT_PENDING, cancel it and release car back to available
        if (normalizeBookingStatus(booking.booking_status) === "PAYMENT_PENDING") {
          await query(
            `UPDATE bookings
             SET booking_status = 'CANCELLED',
                 cancelled_at = NOW(),
                 cancelled_by = 'renter',
                 cancellation_reason = 'Payment cancelled at checkout portal.'
             WHERE id = $1`,
            [numericBookingId]
          );
          await query("UPDATE cars SET status = 'available' WHERE id = $1", [booking.car_id]);
          console.log(`Booking ID ${numericBookingId} cancelled and Car ID ${booking.car_id} released back to available.`);
        }

        console.log("Redirecting user back to:", `${origin}/browse/${targetCarId}?cancelled=true`);
        console.log("===============================================================");
        return NextResponse.redirect(`${origin}/browse/${targetCarId}?cancelled=true`);
      }
    }

    const redirectCarId = carIdStr || "";
    console.log("Redirecting user back to:", `${origin}/browse/${redirectCarId}?cancelled=true`);
    console.log("===============================================================");
    return NextResponse.redirect(`${origin}/browse/${redirectCarId}?cancelled=true`);

  } catch (error) {
    console.error("Payment cancel processing error:", error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/browse?cancelled=true`);
  }
}
