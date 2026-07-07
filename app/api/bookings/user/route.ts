import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const carIdParam = searchParams.get("carId");
    const statusParam = searchParams.get("status");
    
    let sql = `
      SELECT b.*, 
        c.brand, c.model, c.year, c.location as car_location,
        (SELECT COUNT(*) FROM reviews r WHERE r.booking_id = b.id) > 0 as has_review
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      WHERE b.renter_id = $1
    `;
    const params: Array<string | number> = [session.userId];
    let paramIdx = 2;

    if (carIdParam) {
      sql += ` AND b.car_id = $${paramIdx}`;
      params.push(Number(carIdParam));
      paramIdx++;
    }

    if (statusParam) {
      sql += ` AND UPPER(b.booking_status) = UPPER($${paramIdx})`;
      params.push(statusParam);
      paramIdx++;
    }

    sql += " ORDER BY b.created_at DESC";

    const result = await query(sql, params);

    return NextResponse.json({ bookings: result.rows }, { status: 200 });

  } catch (error) {
    console.error("User bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch user bookings" }, { status: 500 });
  }
}
