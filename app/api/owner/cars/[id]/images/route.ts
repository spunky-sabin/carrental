import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { assertOwnerCar, requireOwnerUser } from "@/lib/owner";

type Params = {
  params: Promise<{ id: string }>;
};

async function requireCar(params: Params["params"]) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return { response: NextResponse.json({ error: access.error }, { status: access.status }) };
  }

  const { id } = await params;
  const carId = Number(id);
  const car = await assertOwnerCar(access.user.userId, carId);

  if (!car) {
    return { response: NextResponse.json({ error: "Car not found." }, { status: 404 }) };
  }

  return { access, carId };
}

export async function POST(request: Request, { params }: Params) {
  const result = await requireCar(params);
  if ("response" in result) return result.response;

  const body = await request.json();
  const imageUrl = String(body.image_url || "").trim();

  if (!imageUrl) {
    return NextResponse.json({ error: "Image URL is required." }, { status: 400 });
  }

  const orderResult = await query<{ next_order: number }>(
    "SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM car_images WHERE car_id = $1",
    [result.carId]
  );
  const isFirst = orderResult.rows[0].next_order === 0;
  const inserted = await query(
    `INSERT INTO car_images (car_id, image_url, is_primary, display_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [result.carId, imageUrl, isFirst, orderResult.rows[0].next_order]
  );

  return NextResponse.json({ image: inserted.rows[0], message: "Image uploaded." }, { status: 201 });
}

export async function PATCH(request: Request, { params }: Params) {
  const result = await requireCar(params);
  if ("response" in result) return result.response;

  const body = await request.json();
  const imageId = Number(body.imageId);

  if (!imageId) {
    return NextResponse.json({ error: "Image ID is required." }, { status: 400 });
  }

  if (body.action === "primary") {
    await query("UPDATE car_images SET is_primary = false WHERE car_id = $1", [result.carId]);
    await query("UPDATE car_images SET is_primary = true WHERE id = $1 AND car_id = $2", [imageId, result.carId]);
    return NextResponse.json({ message: "Primary image updated." });
  }

  if (body.action === "reorder") {
    const currentResult = await query<{ id: number; display_order: number }>(
      "SELECT id, display_order FROM car_images WHERE id = $1 AND car_id = $2",
      [imageId, result.carId]
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    const current = currentResult.rows[0];
    const operator = body.direction === "up" ? "<" : ">";
    const ordering = body.direction === "up" ? "DESC" : "ASC";
    const neighborResult = await query<{ id: number; display_order: number }>(
      `SELECT id, display_order
       FROM car_images
       WHERE car_id = $1 AND display_order ${operator} $2
       ORDER BY display_order ${ordering}
       LIMIT 1`,
      [result.carId, current.display_order]
    );

    if (neighborResult.rows.length > 0) {
      const neighbor = neighborResult.rows[0];
      await query("UPDATE car_images SET display_order = $1 WHERE id = $2", [neighbor.display_order, current.id]);
      await query("UPDATE car_images SET display_order = $1 WHERE id = $2", [current.display_order, neighbor.id]);
    }

    return NextResponse.json({ message: "Image order updated." });
  }

  return NextResponse.json({ error: "Unsupported image action." }, { status: 400 });
}

export async function DELETE(request: Request, { params }: Params) {
  const result = await requireCar(params);
  if ("response" in result) return result.response;

  const body = await request.json();
  const imageId = Number(body.imageId);

  if (!imageId) {
    return NextResponse.json({ error: "Image ID is required." }, { status: 400 });
  }

  await query("DELETE FROM car_images WHERE id = $1 AND car_id = $2", [imageId, result.carId]);
  await query(
    `UPDATE car_images
     SET is_primary = true
     WHERE id = (
       SELECT id FROM car_images WHERE car_id = $1 ORDER BY display_order ASC, id ASC LIMIT 1
     )
     AND NOT EXISTS (SELECT 1 FROM car_images WHERE car_id = $1 AND is_primary = true)`,
    [result.carId]
  );

  return NextResponse.json({ message: "Image deleted." });
}
