import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { addNotification, ensureOwnerSchema, getCurrentUser, getOwnerApplicationForUser } from "@/lib/owner";

export async function GET() {
  await ensureOwnerSchema();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const application = await getOwnerApplicationForUser(user.userId);
  return NextResponse.json({ application });
}

export async function POST(request: Request) {
  await ensureOwnerSchema();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (user.dbRole === "owner") {
    return NextResponse.json({ error: "You are already an owner." }, { status: 400 });
  }

  const body = await request.json();
  const businessName = String(body.business_name || "").trim() || null;
  const phone = String(body.phone || "").trim();
  const address = String(body.address || "").trim();
  const verificationInfo = String(body.verification_info || "").trim();
  const documentUrls = Array.isArray(body.document_urls)
    ? body.document_urls.map((url: unknown) => String(url).trim()).filter(Boolean)
    : [];

  if (!phone || !address || !verificationInfo || documentUrls.length === 0) {
    return NextResponse.json({ error: "Phone, address, verification information, and at least one document are required." }, { status: 400 });
  }

  const existing = await getOwnerApplicationForUser(user.userId);

  if (existing && String(existing.application_status).toLowerCase() === "pending") {
    return NextResponse.json({ error: "You already have a pending owner application." }, { status: 409 });
  }

  const result = await query(
    `INSERT INTO owner_applications (
       user_id, application_status, rejection_reason, submitted_at, business_name, phone, address,
       verification_info, document_urls, updated_at
     )
     VALUES ($1, 'pending', NULL, NOW(), $2, $3, $4, $5, $6::jsonb, NOW())
     RETURNING *`,
    [user.userId, businessName, phone, address, verificationInfo, JSON.stringify(documentUrls)]
  );
  await addNotification(user.userId, "Owner application submitted", "Your owner application is pending admin review.", "Booking Request");

  return NextResponse.json({ application: result.rows[0], message: "Owner application submitted." }, { status: 201 });
}
