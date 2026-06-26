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
    const { carId, pickupDate, returnDate, pickupLocation, dropoffLocation } = body;

    if (!carId || !pickupDate || !returnDate) {
      return NextResponse.json({ error: "Car ID, pickup date, and return date are required" }, { status: 400 });
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    if (returnD <= pickup) {
      return NextResponse.json({ error: "Return date must be after pickup date" }, { status: 400 });
    }

    const totalDays = Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));

    // Get car price
    const carResult = await query<{ price_per_day: string; status: string }>(
      "SELECT price_per_day, status FROM cars WHERE id = $1 AND is_active = true",
      [carId]
    );

    if (carResult.rows.length === 0) {
      return NextResponse.json({ error: "Car not found or unavailable" }, { status: 404 });
    }

    if (carResult.rows[0].status !== "available") {
      return NextResponse.json({ error: "Car is not available for booking" }, { status: 400 });
    }

    const pricePerDay = Number(carResult.rows[0].price_per_day);
    const totalAmount = pricePerDay * totalDays;

    const result = await query(
      `INSERT INTO bookings (car_id, renter_id, pickup_date, return_date, pickup_location, dropoff_location, total_days, total_amount, booking_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [carId, session.userId, pickupDate, returnDate, pickupLocation || null, dropoffLocation || null, totalDays, totalAmount]
    );

    return NextResponse.json({ booking: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
