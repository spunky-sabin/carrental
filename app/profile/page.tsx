import { redirect } from "next/navigation";
import ProfileScreen from "@/components/profile/ProfileScreen";
import { getAuthenticatedProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile - Qent",
  description: "Manage your Qent profile.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = await getAuthenticatedProfile();

  if (!result) {
    redirect("/");
  }

  const params = await searchParams;
  const updated = params?.updated === "1";

  return (
    <ProfileScreen
      profile={result.profile}
      successMessage={updated ? "Profile updated successfully." : undefined}
    />
  );
}
