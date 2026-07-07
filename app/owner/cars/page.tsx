import OwnerSectionPage from "@/components/owner/OwnerSectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Cars - Owner Dashboard",
};

export default function OwnerCarsPage() {
  return <OwnerSectionPage section="cars" />;
}
