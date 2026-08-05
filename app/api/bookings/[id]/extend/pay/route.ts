import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ensureOwnerSchema } from "@/lib/owner";
import { buildEsewaPayload } from "@/lib/esewa";
import { getPayBridgeClient } from "@/lib/paybridge";

// POST /api/bookings/[id]/extend/pay
// Initiates payment for an approved booking extension
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureOwnerSchema();
    const session = await getSessionUser();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = Number(id);
    const body = await request.json();
    const paymentMethod = String(body.paymentMethod || "esewa");

    // Fetch the approved extension for this booking belonging to this user
    const extResult = await query<{
      id: number;
      booking_id: number;
      requested_return_date: string;
      additional_cost: string;
      status: string;
      renter_id: number;
      car_id: number;
      brand: string;
      model: string;
    }>(
      `SELECT be.id, be.booking_id, be.requested_return_date, be.additional_cost, be.status,
              b.renter_id, b.car_id, c.brand, c.model
       FROM booking_extensions be
       JOIN bookings b ON be.booking_id = b.id
       JOIN cars c ON b.car_id = c.id
       WHERE be.booking_id = $1
         AND be.status = 'APPROVED'
         AND (be.payment_status IS NULL OR be.payment_status = 'UNPAID')
       ORDER BY be.created_at DESC
       LIMIT 1`,
      [bookingId]
    );

    if (extResult.rows.length === 0) {
      return NextResponse.json(
        { error: "No approved unpaid extension found for this booking." },
        { status: 404 }
      );
    }

    const ext = extResult.rows[0];

    if (String(ext.renter_id) !== String(session.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const amountNpr = Number(ext.additional_cost);
    const reqUrl = new URL(request.url);
    const origin = request.headers.get("origin") || `${reqUrl.protocol}//${reqUrl.host}`;

    if (paymentMethod === "esewa") {
      const esewaPayload = buildEsewaPayload({
        bookingId,
        carId: ext.car_id,
        amountNpr,
        origin,
        extensionId: ext.id,
      });

      return NextResponse.json({
        success: true,
        provider: "esewa",
        esewa: esewaPayload,
      });
    }

    // PayBridge flow for extension payment
    try {
      const userResult = await query<{ full_name: string | null; email: string; phone: string | null }>(
        "SELECT full_name, email, phone FROM users WHERE id = $1",
        [session.userId]
      );
      const user = userResult.rows[0];
      const amountInPaisa = Math.round(amountNpr * 100);
      const client = getPayBridgeClient();

      const sessionResponse = await client.checkout.create({
        amount: amountInPaisa,
        currency: "NPR",
        customer: {
          name: user?.full_name || "Customer",
          email: user?.email || "customer@example.com",
          phone: user?.phone || undefined,
        },
        metadata: {
          booking_id: String(bookingId),
          extension_id: String(ext.id),
          order_id: `EXT_${ext.id}`,
        },
        returnUrl: `${origin}/api/payments/extension/callback?booking_id=${bookingId}&extension_id=${ext.id}&provider=paybridge`,
        cancelUrl: `${origin}/api/payments/cancel?booking_id=${bookingId}&extension_id=${ext.id}`,
      });

      return NextResponse.json({
        success: true,
        provider: "paybridge",
        checkout_url: sessionResponse.checkout_url,
      });
    } catch (err) {
      console.error("PayBridge extension payment error:", err);
      return NextResponse.json({ error: "Payment gateway error. Please try again." }, { status: 500 });
    }

  } catch (error) {
    console.error("Extension payment error:", error);
    return NextResponse.json({ error: "Failed to initiate extension payment" }, { status: 500 });
  }
}
