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
    action: "approve" | "reject" | "remove";
    rejection_reason?: string;
  };

  if (!["approve", "reject", "remove"].includes(body.action)) {
    return NextResponse.json({ error: "Invalid action. Must be 'approve', 'reject', or 'remove'." }, { status: 400 });
  }

  if ((body.action === "reject" || body.action === "remove") && !body.rejection_reason?.trim()) {
    return NextResponse.json({ error: "A reason is required." }, { status: 400 });
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
    // Check if the car is currently appealed or suspended
    await query(
      `UPDATE cars
       SET approval_status = 'approved',
           approved_at = NOW(),
           approved_by = $1,
           rejection_reason = NULL,
           appeal_reason = NULL,
           is_active = true,
           status = 'available'
       WHERE id = $2`,
      [access.user.userId, carId]
    );

    // Notify all admins
    const admins = await query<{ id: number }>("SELECT id FROM users WHERE role = 'admin'");

    return NextResponse.json({ message: `${car.brand} ${car.model} listing approved/appeal accepted, and is now live.` });
  }

  if (body.action === "remove") {
    const reason = body.rejection_reason!.trim();
    await query(
      `UPDATE cars
       SET approval_status = 'removed',
           rejection_reason = $1,
           appeal_reason = NULL,
           is_active = false,
           status = CASE WHEN status = 'maintenance' THEN status ELSE 'inactive' END,
           approved_at = NULL
       WHERE id = $2`,
      [reason, carId]
    );

    // Notify all admins
    const admins = await query<{ id: number }>("SELECT id FROM users WHERE role = 'admin'");

    return NextResponse.json({ message: `${car.brand} ${car.model} listing removed/appeal rejected.` });
  }

  // Reject
  const rejectReason = body.rejection_reason!.trim();
  await query(
    `UPDATE cars
     SET approval_status = 'rejected',
         rejection_reason = $1,
         appeal_reason = NULL,
         approved_at = NULL
     WHERE id = $2`,
    [rejectReason, carId]
  );

  return NextResponse.json({ message: `${car.brand} ${car.model} listing rejected.` });
}
