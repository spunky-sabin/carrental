import AdminUsersClient from "@/components/admin/AdminUsersClient";
import { query } from "@/lib/db";
import { getAuthenticatedProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Management - Admin",
};

export type AdminUserRow = {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: string | null;
  is_verified: boolean | null;
  created_at: string;
  booking_count: string;
  listing_count: string;
};

export default async function AdminUsersPage() {
  const profileResult = await getAuthenticatedProfile();

  if (!profileResult) {
    return null;
  }

  const users = await query<AdminUserRow>(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       u.phone,
       u.role,
       u.status,
       u.is_verified,
       u.created_at,
       (SELECT COUNT(*) FROM bookings b WHERE b.renter_id = u.id) AS booking_count,
       (SELECT COUNT(*) FROM cars c WHERE c.owner_id = u.id) AS listing_count
     FROM users u
     ORDER BY u.created_at DESC`
  );

  return <AdminUsersClient profile={profileResult.profile} users={users.rows} />;
}
