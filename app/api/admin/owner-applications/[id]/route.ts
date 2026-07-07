import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { addNotification, requireAdminUser } from "@/lib/owner";

type ApplicationRow = {
  id: number;
  user_id: number;
  application_status: string;
  business_name: string | null;
  phone: string | null;
  address: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdminUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const applicationId = Number(id);
  const body = await request.json();
  const action = String(body.action || "");
  const applicationResult = await query<ApplicationRow>(
    `SELECT id, user_id, application_status, business_name, phone, address
     FROM owner_applications
     WHERE id = $1
     FOR UPDATE`,
    [applicationId]
  );

  if (applicationResult.rows.length === 0) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const application = applicationResult.rows[0];

  if (String(application.application_status || "").toLowerCase() !== "pending") {
    return NextResponse.json({ error: "Only pending applications can be updated." }, { status: 400 });
  }

  if (action === "approve") {
    await query(
      `UPDATE owner_applications
       SET application_status = 'approved',
           approved_at = NOW(),
           rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [applicationId]
    );
    await query(
      `INSERT INTO owner_profiles (
         user_id, business_name, phone, address, average_rating, total_reviews, approved_at, created_at
       )
       SELECT $1, $2, $3, $4, 0, 0, NOW(), NOW()
       WHERE NOT EXISTS (
         SELECT 1 FROM owner_profiles WHERE user_id = $1 AND approved_at IS NOT NULL
       )`,
      [application.user_id, application.business_name, application.phone, application.address]
    );
    await query("UPDATE users SET role = 'owner', is_verified = true WHERE id = $1", [application.user_id]);
    await addNotification(application.user_id, "Owner application approved", "Your owner application was approved. Your Owner Dashboard is now available.", "Booking Accepted");

    return NextResponse.json({ message: "Owner application approved." });
  }

  if (action === "reject") {
    const rejectionReason = String(body.rejection_reason || "").trim();

    if (!rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
    }

    await query(
      `UPDATE owner_applications
       SET application_status = 'rejected',
           rejection_reason = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [applicationId, rejectionReason]
    );
    await addNotification(application.user_id, "Owner application rejected", rejectionReason, "Booking Cancelled");

    return NextResponse.json({ message: "Owner application rejected." });
  }

  return NextResponse.json({ error: "Unsupported admin action." }, { status: 400 });
}
