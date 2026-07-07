import OwnerSectionPage from "@/components/owner/OwnerSectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bookings - Owner Dashboard",
};

export default function OwnerBookingsPage() {
  return <OwnerSectionPage section="bookings" />;
}
