import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureOwnerSchema } from "@/lib/owner";

// This route can be called by a cron job or manually to clean up expired holds
export async function POST() {
  try {
    await ensureOwnerSchema();
    // 1. Find and cancel expired payment_pending holds
    const expiredBookingsResult = await query<{ id: number; car_id: number }>(
      "SELECT id, car_id FROM bookings WHERE UPPER(booking_status) = 'PAYMENT_PENDING' AND COALESCE(expires_at, reservation_expires_at) < NOW()"
    );
    
    let expiredCount = 0;
    
    for (const booking of expiredBookingsResult.rows) {
      await query(
        `UPDATE bookings
         SET booking_status = 'EXPIRED',
             cancelled_at = NOW(),
             cancelled_by = 'system',
             cancellation_reason = 'Reservation expired before payment.'
         WHERE id = $1`,
        [booking.id]
      );
      await query("UPDATE cars SET status = 'available' WHERE id = $1", [booking.car_id]);
      expiredCount++;
    }

    // 2. Move active rentals into return pending after the rental period ends.
    const returnPendingResult = await query(
      "UPDATE bookings SET booking_status = 'RETURN_PENDING' WHERE UPPER(booking_status) = 'ACTIVE' AND return_date < CURRENT_DATE RETURNING id"
    );
    
    return NextResponse.json({ 
      success: true, 
      expiredHoldsCancelled: expiredCount,
      bookingsReturnPending: returnPendingResult.rowCount
    }, { status: 200 });

  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Failed to perform cleanup" }, { status: 500 });
  }
}
