import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { addNotification, ensureOwnerSchema } from "@/lib/owner";
import { parseEsewaResponse, verifyEsewaStatusApi, getEsewaConfig } from "@/lib/esewa";

export async function GET(request: Request) {
  console.log("================ [eSewa Callback GET Request] ================");
  console.log("Full Request URL:", request.url);
  try {
    await ensureOwnerSchema();
    const { searchParams } = new URL(request.url);
    let bookingIdStr = searchParams.get("booking_id");
    let carIdStr = searchParams.get("car_id");
    const dataParam = searchParams.get("data");
    const origin = new URL(request.url).origin;

    console.log("Initial Params -> booking_id:", bookingIdStr, "car_id:", carIdStr, "dataParam present?:", !!dataParam);

    let parsedData = dataParam ? parseEsewaResponse(dataParam) : null;

    if (parsedData?.transaction_uuid) {
      // transaction_uuid format: ORD_<bookingId>_<carId>_<timestamp>_<random>
      const parts = parsedData.transaction_uuid.split("_");
      if (parts.length >= 3) {
        if (!bookingIdStr) bookingIdStr = parts[1];
        if (!carIdStr) carIdStr = parts[2];
      }
    }

    console.log("Resolved Booking ID:", bookingIdStr, "Car ID:", carIdStr);

    if (!bookingIdStr) {
      console.error("eSewa Callback Error: Unable to determine booking_id!");
      return NextResponse.redirect(`${origin}/browse?error=invalid_booking`);
    }

    const numericBookingId = Number(bookingIdStr);

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
      console.error("eSewa Callback Error: Booking not found in database:", numericBookingId);
      return NextResponse.redirect(`${origin}/browse?error=booking_not_found`);
    }

    const booking = bookingResult.rows[0];
    const redirectCarId = carIdStr || booking.car_id;

    let transactionRef = `ESEWA_TX_${Date.now()}`;
    let isStatusComplete = true;

    if (parsedData) {
      if (parsedData.transaction_code) {
        transactionRef = parsedData.transaction_code;
      }

      // Verify with eSewa Status Check API
      if (parsedData.transaction_uuid) {
        const verified = await verifyEsewaStatusApi({
          productCode: parsedData.product_code || getEsewaConfig().productCode,
          totalAmount: parsedData.total_amount || booking.total_amount,
          transactionUuid: parsedData.transaction_uuid,
        });

        if (verified) {
          console.log("eSewa Server-Side Verification Result:", verified);
          if (verified.status === "CANCELED" || verified.status === "FAILED") {
            isStatusComplete = false;
          } else if (verified.ref_id) {
            transactionRef = verified.ref_id;
          }
        }
      }
    }

    // If transaction ended in CANCELED/FAILED state
    if (!isStatusComplete) {
      console.warn("eSewa Callback Warning: Transaction status was NOT complete. Releasing hold.");
      await query(
        `UPDATE bookings
         SET booking_status = 'CANCELLED',
             cancelled_at = NOW(),
             cancelled_by = 'system',
             cancellation_reason = 'eSewa transaction verification cancelled or failed.'
         WHERE id = $1`,
        [numericBookingId]
      );
      await query("UPDATE cars SET status = 'available' WHERE id = $1", [booking.car_id]);
      return NextResponse.redirect(`${origin}/browse/${redirectCarId}?cancelled=true`);
    }

    // If booking is still PAYMENT_PENDING, confirm it
    if (booking.booking_status.toUpperCase() === "PAYMENT_PENDING") {
      const amount = Number(booking.total_amount);

      // Find or create eSewa payment method for renter
      const pmResult = await query<{ id: number }>(
        "SELECT id FROM payment_methods WHERE user_id = $1 AND provider = 'esewa' LIMIT 1",
        [booking.renter_id]
      );
      let pmId: number;
      if (pmResult.rows.length > 0) {
        pmId = pmResult.rows[0].id;
      } else {
        const newPm = await query<{ id: number }>(
          "INSERT INTO payment_methods (name, user_id, provider, is_default, is_active) VALUES ('eSewa Wallet', $1, 'esewa', true, true) RETURNING id",
          [booking.renter_id]
        );
        pmId = newPm.rows[0].id;
      }

      // Record payment
      await query(
        `INSERT INTO payments (booking_id, payment_method_id, amount, payment_status, paid_at, transaction_reference)
         VALUES ($1, $2, $3, 'paid', NOW(), $4)`,
        [numericBookingId, pmId, amount, transactionRef]
      );

      // Update booking status to CONFIRMED
      await query("UPDATE bookings SET booking_status = 'CONFIRMED' WHERE id = $1", [numericBookingId]);

      // Add notifications
      await addNotification(
        booking.owner_id,
        "New booking request",
        `${booking.brand} ${booking.model} has a paid booking request via eSewa awaiting your acceptance.`,
        "Booking Request"
      );
      await addNotification(
        booking.renter_id,
        "Payment received",
        "Your payment via eSewa was received. The owner will now review your booking request.",
        "Payment Received"
      );

      console.log("eSewa Payment Successfully Processed & Confirmed for Booking ID:", numericBookingId);
    } else {
      console.log("Booking already processed previously. Current status:", booking.booking_status);
    }

    console.log("Redirecting user to:", `${origin}/browse/${redirectCarId}?payment=success&booking_id=${numericBookingId}`);
    console.log("==========================================================================");
    return NextResponse.redirect(`${origin}/browse/${redirectCarId}?payment=success&booking_id=${numericBookingId}`);

  } catch (error) {
    console.error("eSewa payment callback error:", error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/browse?error=payment_failed`);
  }
}
