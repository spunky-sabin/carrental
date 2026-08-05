import { redirect } from "next/navigation";
import { getAuthenticatedProfile } from "@/lib/profile";
import { query } from "@/lib/db";
import { ensureOwnerSchema } from "@/lib/owner";
import MyBookings from "./MyBookings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Bookings - Qent",
  description: "View and manage all your car rental bookings",
};

export type BookingWithCar = {
  id: number;
  car_id: number;
  renter_id: number;
  pickup_date: string;
  return_date: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  total_days: number;
  total_amount: string;
  booking_status: string;
  created_at: string;
  expires_at: string | null;
  reservation_expires_at: string | null;
  accepted_at: string | null;
  pickup_confirmed_at: string | null;
  returned_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  owner_notes: string | null;
  // Car info
  brand: string;
  model: string;
  year: number;
  car_location: string;
  primary_image: string | null;
  owner_name: string;
  // Payment info
  payment_status: string | null;
  paid_at: string | null;
  // Review info
  has_review: boolean;
  // Extension info
  pending_extension_id: number | null;
  pending_extension_date: string | null;
  pending_extension_cost: string | null;
  approved_extension_id: number | null;
  approved_extension_date: string | null;
  approved_extension_cost: string | null;
};

export default async function MyBookingsPage() {
  await ensureOwnerSchema();
  const result = await getAuthenticatedProfile();

  if (!result) {
    redirect("/login");
  }

  const bookingsResult = await query<BookingWithCar>(
    `SELECT
       b.id, b.car_id, b.renter_id, b.pickup_date, b.return_date,
       b.pickup_location, b.dropoff_location, b.total_days, b.total_amount,
       b.booking_status, b.created_at, b.expires_at, b.reservation_expires_at,
       b.accepted_at, b.pickup_confirmed_at, b.returned_at, b.completed_at,
       b.cancelled_at, b.cancellation_reason, b.cancelled_by, b.owner_notes,
       c.brand, c.model, c.year, c.location AS car_location,
       (SELECT ci.image_url FROM car_images ci WHERE ci.car_id = c.id AND ci.is_primary = true LIMIT 1) AS primary_image,
       COALESCE(u.full_name, u.email) AS owner_name,
       p.payment_status, p.paid_at,
       EXISTS(SELECT 1 FROM reviews r WHERE r.booking_id = b.id) AS has_review,
       -- Pending extension
       (SELECT be.id FROM booking_extensions be WHERE be.booking_id = b.id AND be.status = 'PENDING' ORDER BY be.created_at DESC LIMIT 1) AS pending_extension_id,
       (SELECT be.requested_return_date FROM booking_extensions be WHERE be.booking_id = b.id AND be.status = 'PENDING' ORDER BY be.created_at DESC LIMIT 1) AS pending_extension_date,
       (SELECT be.additional_cost FROM booking_extensions be WHERE be.booking_id = b.id AND be.status = 'PENDING' ORDER BY be.created_at DESC LIMIT 1) AS pending_extension_cost,
       -- Approved but unpaid extension
       (SELECT be.id FROM booking_extensions be WHERE be.booking_id = b.id AND be.status = 'APPROVED' AND (be.payment_status IS NULL OR be.payment_status = 'UNPAID') ORDER BY be.created_at DESC LIMIT 1) AS approved_extension_id,
       (SELECT be.requested_return_date FROM booking_extensions be WHERE be.booking_id = b.id AND be.status = 'APPROVED' AND (be.payment_status IS NULL OR be.payment_status = 'UNPAID') ORDER BY be.created_at DESC LIMIT 1) AS approved_extension_date,
       (SELECT be.additional_cost FROM booking_extensions be WHERE be.booking_id = b.id AND be.status = 'APPROVED' AND (be.payment_status IS NULL OR be.payment_status = 'UNPAID') ORDER BY be.created_at DESC LIMIT 1) AS approved_extension_cost
     FROM bookings b
     JOIN cars c ON b.car_id = c.id
     JOIN users u ON c.owner_id = u.id
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.renter_id = $1
     ORDER BY b.created_at DESC`,
    [result.profile.id]
  );

  return <MyBookings profile={result.profile} bookings={bookingsResult.rows} />;
}
