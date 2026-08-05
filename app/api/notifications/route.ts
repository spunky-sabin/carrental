import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ensureOwnerSchema } from "@/lib/owner";

export const dynamic = "force-dynamic";

// GET /api/notifications — fetch current user's notifications with unread count
export async function GET(request: Request) {
  try {
    await ensureOwnerSchema();
    const session = await getSessionUser();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 30)));
    const offset = (page - 1) * limit;

    const [notificationsResult, unreadResult] = await Promise.all([
      query<{
        id: number;
        user_id: number;
        title: string;
        message: string;
        notification_type: string | null;
        is_read: boolean;
        created_at: string;
      }>(
        `SELECT id, user_id, title, message, notification_type, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [session.userId, limit, offset]
      ),
      query<{ count: string }>(
        "SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = false",
        [session.userId]
      ),
    ]);

    return NextResponse.json({
      notifications: notificationsResult.rows,
      unread_count: Number(unreadResult.rows[0]?.count || 0),
      page,
      limit,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// PATCH /api/notifications — mark notification(s) as read
export async function PATCH(request: Request) {
  try {
    await ensureOwnerSchema();
    const session = await getSessionUser();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await query(
        "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false",
        [session.userId]
      );
      return NextResponse.json({ message: "All notifications marked as read." });
    }

    if (id) {
      await query(
        "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
        [Number(id), session.userId]
      );
      return NextResponse.json({ message: "Notification marked as read." });
    }

    return NextResponse.json({ error: "Provide id or markAllRead=true" }, { status: 400 });
  } catch (error) {
    console.error("Notifications update error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
