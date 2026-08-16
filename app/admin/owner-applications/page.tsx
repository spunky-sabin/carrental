import { redirect } from "next/navigation";
import AdminOwnerApplicationsClient from "@/components/admin/AdminOwnerApplicationsClient";
import { getOwnerApplications, requireAdminUser } from "@/lib/owner";
import { getAuthenticatedProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Owner Applications - Admin",
  
};

export default async function AdminOwnerApplicationsPage() {
  const access = await requireAdminUser();

  if ("error" in access) {
    redirect(access.status === 401 ? "/" : "/home");
  }

  const profileResult = await getAuthenticatedProfile();

  if (!profileResult) {
    redirect("/");
  }

  const applications = await getOwnerApplications();

  return <AdminOwnerApplicationsClient profile={profileResult.profile} applications={applications} />;
}
