import { redirect } from "next/navigation";
import { getAuthenticatedProfile } from "@/lib/profile";
import { query } from "@/lib/db";
import { ensureOwnerSchema } from "@/lib/owner";
import NotificationsClient from "./NotificationsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications - Qent",
  description: "Your booking and rental notifications",
};

export type NotificationRow = {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string | null;
  is_read: boolean;
  created_at: string;
};

export default async function NotificationsPage() {
  await ensureOwnerSchema();
  const result = await getAuthenticatedProfile();

  if (!result) {
    redirect("/login");
  }

  const notifResult = await query<NotificationRow>(
    `SELECT id, user_id, title, message, notification_type, is_read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 60`,
    [result.profile.id]
  );

  return (
    <NotificationsClient
      profile={result.profile}
      initialNotifications={notifResult.rows}
    />
  );
}
