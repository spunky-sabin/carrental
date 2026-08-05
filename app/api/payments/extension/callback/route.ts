import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { addNotification, ensureOwnerSchema } from "@/lib/owner";

// GET /api/payments/extension/callback
// Called by PayBridge after a booking extension payment completes
export async function GET(request: Request) {
  try {
    await ensureOwnerSchema();
    const { searchParams } = new URL(request.url);
    const extensionIdStr = searchParams.get("extension_id");
    const bookingIdStr = searchParams.get("booking_id");
    const origin = new URL(request.url).origin;

    if (!extensionIdStr || !bookingIdStr) {
      return NextResponse.redirect(`${origin}/bookings?error=invalid_extension`);
    }

    const extensionId = Number(extensionIdStr);
    const bookingId = Number(bookingIdStr);

    const extResult = await query<{
      id: number;
      booking_id: number;
      requested_return_date: string;
      additional_cost: string;
      status: string;
      payment_status: string | null;
      renter_id: number;
      owner_id: number;
      brand: string;
      model: string;
    }>(
      `SELECT be.id, be.booking_id, be.requested_return_date, be.additional_cost, be.status, be.payment_status,
              b.renter_id, c.owner_id, c.brand, c.model
       FROM booking_extensions be
       JOIN bookings b ON be.booking_id = b.id
       JOIN cars c ON b.car_id = c.id
       WHERE be.id = $1 AND be.booking_id = $2`,
      [extensionId, bookingId]
    );

    if (extResult.rows.length === 0) {
      return NextResponse.redirect(`${origin}/bookings?error=extension_not_found`);
    }

    const ext = extResult.rows[0];

    if (ext.payment_status !== "PAID") {
      const transactionRef = `PAYBRIDGE_EXT_${Date.now()}`;

      await query(
        `UPDATE booking_extensions
         SET payment_status = 'PAID',
             paid_at = NOW(),
             transaction_reference = $2
         WHERE id = $1`,
        [extensionId, transactionRef]
      );

      await query(
        `UPDATE bookings
         SET return_date = $2,
             total_days = total_days + (DATE($2::date) - DATE(return_date)),
             total_amount = total_amount + $3
         WHERE id = $1`,
        [bookingId, ext.requested_return_date, Number(ext.additional_cost)]
      );

      await addNotification(
        ext.renter_id,
        "Extension payment received",
        `Your booking for ${ext.brand} ${ext.model} has been extended to ${ext.requested_return_date}.`,
        "Booking Extended"
      );
      await addNotification(
        ext.owner_id,
        "Extension payment received",
        `The renter has paid for the extension of ${ext.brand} ${ext.model} until ${ext.requested_return_date}.`,
        "Payment Received"
      );
    }

    return NextResponse.redirect(`${origin}/bookings?extension_paid=true&booking_id=${bookingId}`);
  } catch (error) {
    console.error("PayBridge extension callback error:", error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/bookings?error=extension_payment_failed`);
  }
}
