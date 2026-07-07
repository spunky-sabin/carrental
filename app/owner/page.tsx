import OwnerSectionPage from "@/components/owner/OwnerSectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Owner Dashboard - Qent",
};

export default function OwnerDashboardPage() {
  return <OwnerSectionPage section="dashboard" />;
}
