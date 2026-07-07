import OwnerSectionPage from "@/components/owner/OwnerSectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics - Owner Dashboard",
};

export default function OwnerAnalyticsPage() {
  return <OwnerSectionPage section="analytics" />;
}
