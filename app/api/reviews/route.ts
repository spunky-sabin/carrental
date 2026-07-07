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

    if (String(booking.booking_status).toUpperCase() !== "COMPLETED") {
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get("carId");

    if (!carId) {
      return NextResponse.json({ error: "Car ID is required" }, { status: 400 });
    }

    const result = await query(
      `SELECT
         r.id,
         r.booking_id,
         r.rating,
         r.comment,
         r.created_at,
         COALESCE(u.full_name, u.email) AS renter_name
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN users u ON b.renter_id = u.id
       WHERE b.car_id = $1
       ORDER BY r.created_at DESC`,
      [Number(carId)]
    );

    return NextResponse.json({ reviews: result.rows }, { status: 200 });
  } catch (error) {
    console.error("Review fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
