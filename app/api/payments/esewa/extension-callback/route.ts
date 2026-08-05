import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { addNotification, ensureOwnerSchema } from "@/lib/owner";
import { parseEsewaResponse, verifyEsewaStatusApi, getEsewaConfig } from "@/lib/esewa";

// GET /api/payments/esewa/extension-callback
// Called by eSewa after a booking extension payment completes
export async function GET(request: Request) {
  console.log("================ [eSewa Extension Callback] ================");
  console.log("Full Request URL:", request.url);
  try {
    await ensureOwnerSchema();
    const { searchParams } = new URL(request.url);
    const dataParam = searchParams.get("data");
    const origin = new URL(request.url).origin;

    let extensionIdStr = searchParams.get("extension_id");
    let bookingIdStr = searchParams.get("booking_id");
    let parsedData = dataParam ? parseEsewaResponse(dataParam) : null;

    // Parse EXT_<extensionId>_<bookingId>_<carId>_<timestamp> from transaction_uuid
    if (parsedData?.transaction_uuid) {
      const parts = parsedData.transaction_uuid.split("_");
      if (parts[0] === "EXT" && parts.length >= 4) {
        if (!extensionIdStr) extensionIdStr = parts[1];
        if (!bookingIdStr) bookingIdStr = parts[2];
      }
    }

    if (!extensionIdStr || !bookingIdStr) {
      console.error("Extension callback: missing extension_id or booking_id");
      return NextResponse.redirect(`${origin}/bookings?error=invalid_extension`);
    }

    const extensionId = Number(extensionIdStr);
    const bookingId = Number(bookingIdStr);

    // Fetch the extension with booking and car details
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
      console.error("Extension not found:", extensionId, bookingId);
      return NextResponse.redirect(`${origin}/bookings?error=extension_not_found`);
    }

    const ext = extResult.rows[0];

    // Verify payment with eSewa status API
    let transactionRef = `ESEWA_EXT_${Date.now()}`;
    let isStatusComplete = true;

    if (parsedData) {
      if (parsedData.transaction_code) {
        transactionRef = parsedData.transaction_code;
      }

      if (parsedData.transaction_uuid) {
        const verified = await verifyEsewaStatusApi({
          productCode: parsedData.product_code || getEsewaConfig().productCode,
          totalAmount: parsedData.total_amount || ext.additional_cost,
          transactionUuid: parsedData.transaction_uuid,
        });

        if (verified) {
          if (verified.status === "CANCELED" || verified.status === "FAILED") {
            isStatusComplete = false;
          } else if (verified.ref_id) {
            transactionRef = verified.ref_id;
          }
        }
      }
    }

    if (!isStatusComplete) {
      console.warn("eSewa extension callback: payment failed or cancelled.");
      return NextResponse.redirect(`${origin}/bookings?extension_cancelled=true`);
    }

    // Only process if not already paid
    if (ext.payment_status !== "PAID") {
      // Mark extension as paid and update booking return date
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

      // Notify both parties
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
    console.error("eSewa extension callback error:", error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/bookings?error=extension_payment_failed`);
  }
}
