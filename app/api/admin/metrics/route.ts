import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [users, bookings, revenue, listings, pendingOwners, pendingCars, favorites] = await Promise.all([
      query<{ count: string }>("SELECT COUNT(*) FROM users"),
      query<{ count: string }>("SELECT COUNT(*) FROM bookings"),
      query<{ total: string }>("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE LOWER(payment_status) = 'paid'"),
      query<{ count: string }>("SELECT COUNT(*) FROM cars"),
      query<{ count: string }>("SELECT COUNT(*) FROM owner_applications WHERE LOWER(application_status) = 'pending'"),
      query<{ count: string }>("SELECT COUNT(*) FROM cars WHERE LOWER(COALESCE(approval_status, 'approved')) = 'pending'"),
      query<{ count: string }>("SELECT COUNT(*) FROM favorites").catch(() => ({ rows: [{ count: "0" }] })),
    ]);

    const metrics = {
      users: Number(users.rows[0]?.count || 0),
      bookings: Number(bookings.rows[0]?.count || 0),
      revenue: Number(revenue.rows[0]?.total || 0),
      listings: Number(listings.rows[0]?.count || 0),
      pendingOwners: Number(pendingOwners.rows[0]?.count || 0),
      pendingCars: Number(pendingCars.rows[0]?.count || 0),
      favorites: Number(favorites.rows[0]?.count || 0),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching admin metrics:", error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
