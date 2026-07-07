import OwnerSectionPage from "@/components/owner/OwnerSectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Owner Profile - Qent",
};

export default function OwnerProfilePage() {
  return <OwnerSectionPage section="profile" />;
}
