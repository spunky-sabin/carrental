import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { addNotification, normalizeBookingStatus, requireOwnerUser } from "@/lib/owner";

type BookingActionRow = {
  id: number;
  car_id: number;
  renter_id: number;
  booking_status: string;
  return_date: string;
  brand: string;
  model: string;
};

async function getOwnerBooking(ownerId: string | number, bookingId: number) {
  const result = await query<BookingActionRow>(
    `SELECT b.id, b.car_id, b.renter_id, b.booking_status, b.return_date, c.brand, c.model
     FROM bookings b
     JOIN cars c ON b.car_id = c.id
     WHERE b.id = $1 AND c.owner_id = $2
     FOR UPDATE`,
    [bookingId, ownerId]
  );

  return result.rows[0] || null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const bookingId = Number(id);
  const body = await request.json();
  const action = String(body.action || "");
  const booking = await getOwnerBooking(access.user.userId, bookingId);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const status = normalizeBookingStatus(booking.booking_status);

  if (action === "accept") {
    if (status !== "CONFIRMED") {
      return NextResponse.json({ error: "Only confirmed paid bookings can be accepted." }, { status: 400 });
    }

    await query("UPDATE bookings SET booking_status = 'OWNER_ACCEPTED', accepted_at = NOW() WHERE id = $1", [bookingId]);
    await addNotification(booking.renter_id, "Booking accepted", `${booking.brand} ${booking.model} has been accepted by the owner.`, "Booking Accepted");
    return NextResponse.json({ message: "Booking accepted." });
  }

  if (action === "reject") {
    if (!["CONFIRMED", "OWNER_ACCEPTED"].includes(status)) {
      return NextResponse.json({ error: "This booking cannot be rejected now." }, { status: 400 });
    }

    const reason = String(body.cancellation_reason || "Rejected by owner.").trim();
    await query(
      `UPDATE bookings
       SET booking_status = 'REJECTED',
           cancelled_at = NOW(),
           cancelled_by = 'owner',
           cancellation_reason = $2
       WHERE id = $1`,
      [bookingId, reason]
    );
    await query("UPDATE cars SET status = 'available' WHERE id = $1 AND status <> 'maintenance'", [booking.car_id]);
    await addNotification(booking.renter_id, "Booking rejected", `${booking.brand} ${booking.model} was rejected. ${reason}`, "Booking Cancelled");
    return NextResponse.json({ message: "Booking rejected." });
  }

  if (action === "ready_for_pickup") {
    if (status !== "OWNER_ACCEPTED") {
      return NextResponse.json({ error: "Only accepted bookings can be marked ready for pickup." }, { status: 400 });
    }

    await query("UPDATE bookings SET booking_status = 'READY_FOR_PICKUP' WHERE id = $1", [bookingId]);
    await addNotification(booking.renter_id, "Vehicle ready for pickup", `${booking.brand} ${booking.model} is ready for pickup.`, "Vehicle Return Due");
    return NextResponse.json({ message: "Vehicle marked ready for pickup." });
  }

  if (action === "hand_over") {
    if (!["OWNER_ACCEPTED", "READY_FOR_PICKUP"].includes(status)) {
      return NextResponse.json({ error: "Vehicle can only be handed over after owner acceptance." }, { status: 400 });
    }

    await query(
      `UPDATE bookings
       SET booking_status = 'ACTIVE',
           pickup_confirmed_at = NOW(),
           pickup_odometer = $2,
           pickup_fuel_level = $3
       WHERE id = $1`,
      [bookingId, Number(body.pickup_odometer || 0), String(body.pickup_fuel_level || "Full")]
    );
    await query("UPDATE cars SET status = 'booked' WHERE id = $1", [booking.car_id]);
    await addNotification(booking.renter_id, "Vehicle handed over", `${booking.brand} ${booking.model} rental is now active.`, "Booking Accepted");
    return NextResponse.json({ message: "Vehicle handed over and rental activated." });
  }

  if (action === "receive_vehicle" || action === "complete") {
    if (!["ACTIVE", "RETURN_PENDING"].includes(status)) {
      return NextResponse.json({ error: "Only active or return-pending bookings can be completed." }, { status: 400 });
    }

    await query(
      `UPDATE bookings
       SET booking_status = 'COMPLETED',
           returned_at = COALESCE(returned_at, NOW()),
           completed_at = NOW(),
           return_odometer = COALESCE($2, return_odometer),
           return_fuel_level = COALESCE($3, return_fuel_level),
           damage_notes = COALESCE($4, damage_notes)
       WHERE id = $1`,
      [
        bookingId,
        body.return_odometer === undefined ? null : Number(body.return_odometer),
        body.return_fuel_level ? String(body.return_fuel_level) : null,
        body.damage_notes ? String(body.damage_notes) : null,
      ]
    );
    await query("UPDATE cars SET status = 'available' WHERE id = $1 AND status <> 'maintenance'", [booking.car_id]);
    await addNotification(booking.renter_id, "Vehicle returned", `${booking.brand} ${booking.model} rental has been completed.`, "Vehicle Returned");
    return NextResponse.json({ message: "Vehicle received and booking completed." });
  }

  if (action === "report_damage") {
    const description = String(body.damage_notes || "Damage reported by owner.").trim();
    await query(
      `INSERT INTO damage_reports (booking_id, description, estimated_cost, photos)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [bookingId, description, body.estimated_cost ? Number(body.estimated_cost) : null, JSON.stringify(body.photos || [])]
    );
    await query("UPDATE bookings SET damage_notes = $2 WHERE id = $1", [bookingId, description]);
    await addNotification(booking.renter_id, "Damage report received", `A damage report was added for ${booking.brand} ${booking.model}.`, "Vehicle Returned");
    return NextResponse.json({ message: "Damage report recorded." });
  }

  if (action === "notes") {
    await query("UPDATE bookings SET owner_notes = $2 WHERE id = $1", [bookingId, String(body.owner_notes || "").trim() || null]);
    return NextResponse.json({ message: "Owner notes saved." });
  }

  return NextResponse.json({ error: "Unsupported booking action." }, { status: 400 });
}
