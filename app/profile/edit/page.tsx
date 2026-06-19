import { redirect } from "next/navigation";
import EditProfileForm from "@/components/profile/EditProfileForm";
import { getAuthenticatedProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Profile - Qent",
  description: "Update your Qent profile details.",
};

export default async function EditProfilePage() {
  const result = await getAuthenticatedProfile();

  if (!result) {
    redirect("/");
  }

  return <EditProfileForm profile={result.profile} />;
}
