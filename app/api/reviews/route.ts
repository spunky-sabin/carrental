import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, rating, comment } = body;

    if (!bookingId || !rating) {
      return NextResponse.json({ error: "Booking ID and rating are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Verify the booking belongs to this user and is completed
    const bookingResult = await query<{ id: number; renter_id: number; booking_status: string }>(
      "SELECT id, renter_id, booking_status FROM bookings WHERE id = $1",
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingResult.rows[0];
    if (String(booking.renter_id) !== String(session.userId)) {
      return NextResponse.json({ error: "You can only review your own bookings" }, { status: 403 });
    }

    if (booking.booking_status !== "completed") {
      return NextResponse.json({ error: "You can only review completed bookings" }, { status: 400 });
    }

    // Check if review already exists
    const existingReview = await query(
      "SELECT id FROM reviews WHERE booking_id = $1",
      [bookingId]
    );

    if (existingReview.rows.length > 0) {
      return NextResponse.json({ error: "You have already reviewed this booking" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO reviews (booking_id, rating, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [bookingId, rating, comment || null]
    );

    return NextResponse.json({ review: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
