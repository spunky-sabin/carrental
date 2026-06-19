import { redirect } from "next/navigation";
import { PlaceholderScreen } from "@/components/app/AppUI";
import { getAuthenticatedProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications - Qent",
};

export default async function NotificationsPage() {
  const result = await getAuthenticatedProfile();

  if (!result) {
    redirect("/");
  }

  return (
    <PlaceholderScreen
      profile={result.profile}
      title="Notifications"
      description="Notification data is intentionally mocked for now and will be wired to backend events later."
      icon="bell"
    />
  );
}
