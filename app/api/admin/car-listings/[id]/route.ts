import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/owner";
import { query } from "@/lib/db";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const access = await requireAdminUser();
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const carId = Number(id);

  if (!carId) {
    return NextResponse.json({ error: "Invalid car ID." }, { status: 400 });
  }

  const body = await request.json() as {
    action: "approve" | "reject";
    rejection_reason?: string;
  };

  if (!["approve", "reject"].includes(body.action)) {
    return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'." }, { status: 400 });
  }

  if (body.action === "reject" && !body.rejection_reason?.trim()) {
    return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
  }

  // Fetch the car to get owner_id
  const carResult = await query<{ id: number; owner_id: number; brand: string; model: string }>(
    "SELECT id, owner_id, brand, model FROM cars WHERE id = $1",
    [carId]
  );

  if (carResult.rows.length === 0) {
    return NextResponse.json({ error: "Car not found." }, { status: 404 });
  }

  const car = carResult.rows[0];

  if (body.action === "approve") {
    await query(
      `UPDATE cars
       SET approval_status = 'approved',
           approved_at = NOW(),
           approved_by = $1,
           rejection_reason = NULL
       WHERE id = $2`,
      [access.user.userId, carId]
    );

    // Notify the owner
    await query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
       VALUES ($1, $2, $3, $4, false, NOW())`,
      [
        car.owner_id,
        "Car Listing Approved ✓",
        `Your ${car.brand} ${car.model} listing has been approved and is now publicly visible.`,
        "listing_approved",
      ]
    ).catch(() => null);

    return NextResponse.json({ message: `${car.brand} ${car.model} listing approved and is now live.` });
  }

  // Reject
  await query(
    `UPDATE cars
     SET approval_status = 'rejected',
         rejection_reason = $1,
         approved_at = NULL
     WHERE id = $2`,
    [body.rejection_reason!.trim(), carId]
  );

  // Notify the owner
  await query(
    `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
     VALUES ($1, $2, $3, $4, false, NOW())`,
    [
      car.owner_id,
      "Car Listing Rejected",
      `Your ${car.brand} ${car.model} listing was rejected. Reason: ${body.rejection_reason}. Please edit and resubmit.`,
      "listing_rejected",
    ]
  ).catch(() => null);

  return NextResponse.json({ message: `${car.brand} ${car.model} listing rejected.` });
}
