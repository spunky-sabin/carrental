import OwnerSectionPage from "@/components/owner/OwnerSectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Availability - Owner Dashboard",
};

export default function OwnerAvailabilityPage() {
  return <OwnerSectionPage section="availability" />;
}
