import { redirect } from "next/navigation";
import { getOwnerApplications, getAdminCarListings, requireAdminUser, getAdminUsers } from "@/lib/owner";
import { getAuthenticatedProfile } from "@/lib/profile";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const access = await requireAdminUser();

  if ("error" in access) {
    redirect(access.status === 401 ? "/" : "/home");
  }

  const profileResult = await getAuthenticatedProfile();

  if (!profileResult) {
    redirect("/");
  }

  // NOTE: these three calls mirror the data already fetched independently
  // on /admin/owner-applications, /admin/car-listings, and /admin/users.
  // Swap in your real function names/signatures if they differ —
  // getAdminUsers and getAdminCarListings are inferred from the
  // AdminUserRow / AdminCarListing types you showed me, not confirmed names.
  const [applications, listings, users] = await Promise.all([
    getOwnerApplications(),
    getAdminCarListings(),
    getAdminUsers(),
  ]);

  return (
    <AdminDashboardClient
      profile={profileResult.profile}
      applications={applications}
      listings={listings}
      users={users}
    />
  );
}
