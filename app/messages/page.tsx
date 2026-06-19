import { redirect } from "next/navigation";
import { PlaceholderScreen } from "@/components/app/AppUI";
import { getAuthenticatedProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Messages - Qent",
};

export default async function MessagesPage() {
  const result = await getAuthenticatedProfile();

  if (!result) {
    redirect("/");
  }

  return (
    <PlaceholderScreen
      profile={result.profile}
      title="Messages"
      description="Customer and host messaging is reserved for the booking workflow."
      icon="message"
    />
  );
}
