
import { getAuthenticatedProfile } from "@/lib/profile";
import { getOwnerDashboardData, requireOwnerUser } from "@/lib/owner";
import OwnerDashboardClient from "@/components/owner/OwnerDashboardClient";

type OwnerSection =
  | "dashboard"
  | "cars"
  | "bookings"
  | "booking-detail"
  | "earnings"
  | "reviews"
  | "notifications"
  | "calendar"
  | "availability"
  | "maintenance"
  | "documents"
  | "analytics"
  | "profile";

export default async function OwnerSectionPage({
  section,
  bookingId,
}: {
  section: OwnerSection;
  bookingId?: number;
}) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return null;
  }

  const profileResult = await getAuthenticatedProfile();

  if (!profileResult) {
    return null;
  }

  const data = await getOwnerDashboardData(access.user.userId);

  return (
    <OwnerDashboardClient
      profile={profileResult.profile}
      data={data}
      section={section}
      bookingId={bookingId}
    />
  );
}
