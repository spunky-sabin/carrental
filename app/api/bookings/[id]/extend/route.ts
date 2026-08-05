import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { addNotification, ensureOwnerSchema, normalizeBookingStatus } from "@/lib/owner";

// POST /api/bookings/[id]/extend
// User requests a booking extension (must be ACTIVE status)
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

    const body = await request.json();
    const { newReturnDate } = body;

    if (!newReturnDate) {
      return NextResponse.json({ error: "New return date is required" }, { status: 400 });
    }

    const bookingResult = await query<{
      id: number;
      renter_id: number;
      car_id: number;
      booking_status: string;
      return_date: string;
      total_amount: string;
      total_days: number;
      owner_id: number;
      brand: string;
      model: string;
      price_per_day: string;
    }>(
      `SELECT b.id, b.renter_id, b.car_id, b.booking_status, b.return_date, b.total_amount, b.total_days,
              c.owner_id, c.brand, c.model, c.price_per_day
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
    if (status !== "ACTIVE" && status !== "RETURN_REQUESTED") {
      return NextResponse.json(
        { error: "Extensions can only be requested for active rentals." },
        { status: 400 }
      );
    }

    // Validate new return date is after current return date
    const currentReturn = new Date(booking.return_date);
    const newReturn = new Date(newReturnDate);
    if (newReturn <= currentReturn) {
      return NextResponse.json(
        { error: "New return date must be after the current return date." },
        { status: 400 }
      );
    }

    // Check for overlapping bookings on the same car during extension period
    const overlapResult = await query<{ overlaps: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM bookings
         WHERE car_id = $1
           AND id != $2
           AND UPPER(booking_status) IN ('CONFIRMED','OWNER_ACCEPTED','READY_FOR_PICKUP','ACTIVE','RETURN_PENDING','RETURN_REQUESTED')
           AND daterange(pickup_date, return_date, '[]') && daterange($3::date, $4::date, '[]')
       ) AS overlaps`,
      [booking.car_id, bookingId, booking.return_date, newReturnDate]
    );

    if (overlapResult.rows[0]?.overlaps) {
      return NextResponse.json(
        { error: "The car has another booking during the requested extension period." },
        { status: 400 }
      );
    }

    // Check for any pending extension requests for this booking
    const pendingExt = await query<{ id: number }>(
      "SELECT id FROM booking_extensions WHERE booking_id = $1 AND status IN ('PENDING', 'APPROVED') LIMIT 1",
      [bookingId]
    );

    if (pendingExt.rows.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending extension request for this booking." },
        { status: 400 }
      );
    }

    // Calculate additional cost
    const extraDays = Math.ceil((newReturn.getTime() - currentReturn.getTime()) / (1000 * 60 * 60 * 24));
    const pricePerDay = Number(booking.price_per_day);
    const additionalCost = extraDays * pricePerDay;

    // Insert extension request
    const extResult = await query<{ id: number }>(
      `INSERT INTO booking_extensions (booking_id, requested_return_date, additional_cost, status, created_at)
       VALUES ($1, $2, $3, 'PENDING', NOW())
       RETURNING id`,
      [bookingId, newReturnDate, additionalCost]
    );

    const extensionId = extResult.rows[0].id;

    // Notify owner
    await addNotification(
      booking.owner_id,
      "Extension request received",
      `${booking.brand} ${booking.model} renter has requested an extension until ${newReturnDate}. Additional cost: Rs. ${additionalCost.toLocaleString()}.`,
      "Extension Request"
    );

    return NextResponse.json({
      message: "Extension request submitted. Awaiting owner approval.",
      extension: {
        id: extensionId,
        new_return_date: newReturnDate,
        extra_days: extraDays,
        additional_cost: additionalCost,
        status: "PENDING",
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Extension request error:", error);
    return NextResponse.json({ error: "Failed to submit extension request" }, { status: 500 });
  }
}
