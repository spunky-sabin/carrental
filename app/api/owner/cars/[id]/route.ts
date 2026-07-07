import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { assertOwnerCar, requireOwnerUser } from "@/lib/owner";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const carId = Number(id);
  const car = await assertOwnerCar(access.user.userId, carId);

  if (!car) {
    return NextResponse.json({ error: "Car not found." }, { status: 404 });
  }

  const body = await request.json();

  if (body.action === "hide") {
    await query("UPDATE cars SET is_active = false, status = 'inactive' WHERE id = $1 AND owner_id = $2", [carId, access.user.userId]);
    return NextResponse.json({ message: "Listing hidden." });
  }

  if (body.action === "reactivate") {
    await query("UPDATE cars SET is_active = true, status = 'available' WHERE id = $1 AND owner_id = $2", [carId, access.user.userId]);
    return NextResponse.json({ message: "Listing reactivated." });
  }

  if (body.action === "resubmit") {
    await query(
      `UPDATE cars SET approval_status = 'pending', rejection_reason = NULL, submitted_at = NOW() WHERE id = $1 AND owner_id = $2`,
      [carId, access.user.userId]
    );
    return NextResponse.json({ message: "Listing resubmitted for admin review." });
  }

  const features = Array.isArray(body.features) ? body.features : [];

  const updated = await query(
    `UPDATE cars
     SET brand = $1,
         model = $2,
         category = $3,
         year = $4,
         color = $5,
         fuel_type = $6,
         transmission = $7,
         seats = $8,
         mileage = $9,
         license_plate = $10,
         description = $11,
         price_per_day = $12,
         location = $13,
         status = $14,
         is_active = $15,
         minimum_rental_days = $16,
         maximum_rental_days = $17,
         instant_booking = $18,
         delivery_available = $19,
         features = $20,
         approval_status = 'pending',
         rejection_reason = NULL,
         submitted_at = NOW()
     WHERE id = $21 AND owner_id = $22
     RETURNING *`,
    [
      String(body.brand || "").trim(),
      String(body.model || "").trim(),
      body.category || "sedan",
      Number(body.year),
      body.color || null,
      body.fuel_type || null,
      body.transmission || null,
      Number(body.seats) || 5,
      body.mileage ? Number(body.mileage) : null,
      String(body.license_plate || "").trim(),
      body.description || null,
      Number(body.price_per_day) || 0,
      String(body.location || "").trim(),
      body.status || "available",
      body.is_active ?? true,
      body.minimum_rental_days ? Number(body.minimum_rental_days) : 1,
      body.maximum_rental_days ? Number(body.maximum_rental_days) : null,
      body.instant_booking ?? false,
      body.delivery_available ?? false,
      JSON.stringify(features),
      carId,
      access.user.userId,
    ]
  );

  return NextResponse.json({ car: updated.rows[0], message: "Car listing updated and resubmitted for review." });

}

export async function DELETE(_request: Request, { params }: Params) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const carId = Number(id);
  const car = await assertOwnerCar(access.user.userId, carId);

  if (!car) {
    return NextResponse.json({ error: "Car not found." }, { status: 404 });
  }

  await query("UPDATE cars SET is_active = false, status = 'inactive' WHERE id = $1 AND owner_id = $2", [carId, access.user.userId]);
  return NextResponse.json({ message: "Listing deleted from active inventory." });
}
