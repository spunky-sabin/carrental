import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ensureOwnerSchema } from "@/lib/owner";

export async function GET() {
  await ensureOwnerSchema();
  const session = await getSessionUser();

  if (!session?.userId) {
    return NextResponse.json({ carIds: [] });
  }

  const result = await query<{ car_id: number }>(
    "SELECT car_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC",
    [session.userId]
  );

  return NextResponse.json({ carIds: result.rows.map((row) => row.car_id) });
}

export async function POST(request: Request) {
  await ensureOwnerSchema();
  const session = await getSessionUser();

  if (!session?.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const carId = Number(body.carId);

  if (!carId) {
    return NextResponse.json({ error: "Car ID is required." }, { status: 400 });
  }

  await query(
    `INSERT INTO favorites (user_id, car_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, car_id) DO NOTHING`,
    [session.userId, carId]
  );

  return NextResponse.json({ favorited: true, message: "Car added to favorites." });
}

export async function DELETE(request: Request) {
  await ensureOwnerSchema();
  const session = await getSessionUser();

  if (!session?.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const carId = Number(body.carId);

  if (!carId) {
    return NextResponse.json({ error: "Car ID is required." }, { status: 400 });
  }

  await query("DELETE FROM favorites WHERE user_id = $1 AND car_id = $2", [session.userId, carId]);

  return NextResponse.json({ favorited: false, message: "Car removed from favorites." });
}
