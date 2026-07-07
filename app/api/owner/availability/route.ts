import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { assertOwnerCar, requireOwnerUser } from "@/lib/owner";

export async function POST(request: Request) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json();
  const carId = Number(body.car_id);
  const car = await assertOwnerCar(access.user.userId, carId);

  if (!car) {
    return NextResponse.json({ error: "Car not found." }, { status: 404 });
  }

  if (!body.start_date || !body.end_date || body.end_date < body.start_date) {
    return NextResponse.json({ error: "Valid start and end dates are required." }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO car_availability (car_id, start_date, end_date, reason, blocked_by_owner)
     VALUES ($1, $2, $3, $4, true)
     RETURNING *`,
    [carId, body.start_date, body.end_date, String(body.reason || "Owner blocked").trim()]
  );

  return NextResponse.json({ block: result.rows[0], message: "Dates blocked." }, { status: 201 });
}

export async function DELETE(request: Request) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json();
  await query(
    `DELETE FROM car_availability ca
     USING cars c
     WHERE ca.car_id = c.id AND c.owner_id = $1 AND ca.id = $2`,
    [access.user.userId, Number(body.id)]
  );

  return NextResponse.json({ message: "Blocked dates removed." });
}
