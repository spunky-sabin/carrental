import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ensureOwnerSchema } from "@/lib/owner";

export async function POST(request: Request) {
  try {
    await ensureOwnerSchema();
    const session = await getSessionUser();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { carId, pickupDate, returnDate } = body;

    if (!carId || !pickupDate || !returnDate) {
      return NextResponse.json({ error: "Car ID, pickup date, and return date are required" }, { status: 400 });
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    if (returnD < pickup) {
      return NextResponse.json({ error: "Return date cannot be before pickup date" }, { status: 400 });
    }

    const totalDays = Math.max(1, Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)));

    // Get car price, status, and approval — all must pass for booking to proceed
    const carResult = await query<{ price_per_day: string; status: string; owner_id: number; location: string; minimum_rental_days: number | null; maximum_rental_days: number | null; approval_status: string | null }>(
      "SELECT price_per_day, status, owner_id, location, minimum_rental_days, maximum_rental_days, approval_status FROM cars WHERE id = $1 AND is_active = true FOR UPDATE",
      [carId]
    );

    if (carResult.rows.length === 0) {
      return NextResponse.json({ error: "Car not found or unavailable" }, { status: 404 });
    }

    const car = carResult.rows[0];

    // Enforce approval gate — pending and rejected cars cannot be booked
    const approvalStatus = String(car.approval_status || "pending").toLowerCase();
    if (approvalStatus !== "approved") {
      return NextResponse.json({ error: "This car is not available for booking" }, { status: 400 });
    }

    if (car.status !== "available") {
      return NextResponse.json({ error: "Car is not available for booking" }, { status: 400 });
    }

    if (String(car.owner_id) === String(session.userId)) {
      return NextResponse.json({ error: "Owners cannot book their own car" }, { status: 400 });
    }

    const minimumDays = car.minimum_rental_days || 1;
    const maximumDays = car.maximum_rental_days;

    if (totalDays < minimumDays) {
      return NextResponse.json({ error: `Minimum rental duration is ${minimumDays} day(s)` }, { status: 400 });
    }

    if (maximumDays && totalDays > maximumDays) {
      return NextResponse.json({ error: `Maximum rental duration is ${maximumDays} day(s)` }, { status: 400 });
    }

    // Check owner-set availability blocks
    const blockedResult = await query<{ blocked: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM car_availability
         WHERE car_id = $1
           AND daterange(start_date, end_date, '[]') && daterange($2::date, $3::date, '[]')
       ) AS blocked`,
      [carId, pickupDate, returnDate]
    );

    if (blockedResult.rows[0]?.blocked) {
      return NextResponse.json({ error: "Car is unavailable for the selected dates" }, { status: 400 });
    }

    // Check for overlapping confirmed/active bookings to prevent double-booking
    const overlapResult = await query<{ overlaps: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM bookings
         WHERE car_id = $1
           AND UPPER(booking_status) IN ('CONFIRMED','OWNER_ACCEPTED','READY_FOR_PICKUP','ACTIVE','RETURN_PENDING','RETURN_REQUESTED')
           AND daterange(pickup_date, return_date, '[]') && daterange($2::date, $3::date, '[]')
       ) AS overlaps`,
      [carId, pickupDate, returnDate]
    );

    if (overlapResult.rows[0]?.overlaps) {
      return NextResponse.json({ error: "Car already has a confirmed booking for those dates" }, { status: 400 });
    }

    const pricePerDay = Number(car.price_per_day);
    const totalAmount = pricePerDay * totalDays;

    // Create the booking with a short payment hold. After payment, owners receive a CONFIRMED request.
    const result = await query(
      `INSERT INTO bookings (
         car_id, renter_id, pickup_date, return_date, pickup_location, dropoff_location,
         total_days, total_amount, booking_status, reservation_expires_at, expires_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PAYMENT_PENDING', NOW() + INTERVAL '5 minutes', NOW() + INTERVAL '5 minutes')
       RETURNING *`,
      [carId, session.userId, pickupDate, returnDate, car.location, car.location, totalDays, totalAmount]
    );

    // Mark car as booked
    await query(
      "UPDATE cars SET status = 'booked' WHERE id = $1",
      [carId]
    );

    return NextResponse.json({ booking: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
