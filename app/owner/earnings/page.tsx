import OwnerSectionPage from "@/components/owner/OwnerSectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Earnings - Owner Dashboard",
};

export default function OwnerEarningsPage() {
  return <OwnerSectionPage section="earnings" />;
}
