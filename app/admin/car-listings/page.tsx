import { redirect } from "next/navigation";
import AdminCarListingsClient from "@/components/admin/AdminCarListingsClient";
import { getAdminCarListings, requireAdminUser } from "@/lib/owner";
import { getAuthenticatedProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Car Listings Review - Admin",
};

export default async function AdminCarListingsPage() {
  const access = await requireAdminUser();

  if ("error" in access) {
    redirect(access.status === 401 ? "/" : "/home");
  }

  const profileResult = await getAuthenticatedProfile();

  if (!profileResult) {
    redirect("/");
  }

  const listings = await getAdminCarListings("all");

  return <AdminCarListingsClient profile={profileResult.profile} listings={listings} />;
}
