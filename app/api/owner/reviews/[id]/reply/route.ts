import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { addNotification, ensureOwnerSchema, requireOwnerUser } from "@/lib/owner";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureOwnerSchema();
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const reviewId = Number(id);
  const body = await request.json();
  const reply = String(body.reply || "").trim();

  if (!reviewId) {
    return NextResponse.json({ error: "Invalid review ID." }, { status: 400 });
  }

  if (!reply) {
    return NextResponse.json({ error: "Reply is required." }, { status: 400 });
  }

  const reviewResult = await query<{ renter_id: number; brand: string; model: string }>(
    `SELECT b.renter_id, c.brand, c.model
     FROM reviews r
     JOIN bookings b ON r.booking_id = b.id
     JOIN cars c ON b.car_id = c.id
     WHERE r.id = $1 AND c.owner_id = $2`,
    [reviewId, access.user.userId]
  );

  if (reviewResult.rows.length === 0) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  await query(
    `UPDATE reviews
     SET owner_reply = $2,
         owner_replied_at = NOW()
     WHERE id = $1`,
    [reviewId, reply]
  );

  const review = reviewResult.rows[0];
  await addNotification(
    review.renter_id,
    "Owner replied to your review",
    `The owner replied to your review for ${review.brand} ${review.model}.`,
    "Review Received"
  );

  return NextResponse.json({ message: "Review reply saved." });
}
