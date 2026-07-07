import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireOwnerUser } from "@/lib/owner";

export async function PATCH(request: Request) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json();
  const result = await query(
    `UPDATE owner_profiles
     SET business_name = $2,
         phone = $3,
         email = $4,
         address = $5,
         bank_name = $6,
         bank_account_name = $7,
         bank_account_number = $8,
         payment_details = $9,
         profile_photo = $10
     WHERE user_id = $1
     RETURNING *`,
    [
      access.user.userId,
      String(body.business_name || "").trim() || null,
      String(body.phone || "").trim() || null,
      String(body.email || "").trim() || null,
      String(body.address || "").trim() || null,
      String(body.bank_name || "").trim() || null,
      String(body.bank_account_name || "").trim() || null,
      String(body.bank_account_number || "").trim() || null,
      String(body.payment_details || "").trim() || null,
      String(body.profile_photo || "").trim() || null,
    ]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Owner profile not found." }, { status: 404 });
  }

  return NextResponse.json({ profile: result.rows[0], message: "Owner profile updated." });
}
