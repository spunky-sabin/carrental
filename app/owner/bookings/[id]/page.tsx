import OwnerSectionPage from "@/components/owner/OwnerSectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Booking Detail - Owner Dashboard",
};

export default async function OwnerBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OwnerSectionPage section="booking-detail" bookingId={Number(id)} />;
}
