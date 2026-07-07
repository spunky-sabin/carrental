import OwnerSectionPage from "@/components/owner/OwnerSectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Owner Notifications - Qent",
};

export default function OwnerNotificationsPage() {
  return <OwnerSectionPage section="notifications" />;
}
