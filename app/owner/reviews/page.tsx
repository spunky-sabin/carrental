import OwnerSectionPage from "@/components/owner/OwnerSectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reviews - Owner Dashboard",
};

export default function OwnerReviewsPage() {
  return <OwnerSectionPage section="reviews" />;
}
