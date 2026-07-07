import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { addNotification, assertOwnerCar, requireOwnerUser } from "@/lib/owner";

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

  if (!body.document_type || !body.file_url) {
    return NextResponse.json({ error: "Document type and file URL are required." }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO car_documents (car_id, document_type, file_url, expiry_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [carId, String(body.document_type).trim(), String(body.file_url).trim(), body.expiry_date || null]
  );
  await addNotification(access.user.userId, "Vehicle document uploaded", `${body.document_type} document was uploaded.`, "Maintenance Reminder");

  return NextResponse.json({ document: result.rows[0], message: "Document uploaded." }, { status: 201 });
}

export async function DELETE(request: Request) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json();
  await query(
    `DELETE FROM car_documents cd
     USING cars c
     WHERE cd.car_id = c.id AND c.owner_id = $1 AND cd.id = $2`,
    [access.user.userId, Number(body.id)]
  );

  return NextResponse.json({ message: "Document deleted." });
}
