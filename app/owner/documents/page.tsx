import OwnerSectionPage from "@/components/owner/OwnerSectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Documents - Owner Dashboard",
};

export default function OwnerDocumentsPage() {
  return <OwnerSectionPage section="documents" />;
}
