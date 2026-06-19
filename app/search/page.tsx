import { redirect } from "next/navigation";
import { PlaceholderScreen } from "@/components/app/AppUI";
import { getAuthenticatedProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search - Qent",
};

export default async function SearchPage() {
  const result = await getAuthenticatedProfile();

  if (!result) {
    redirect("/");
  }

  return (
    <PlaceholderScreen
      profile={result.profile}
      title="Search"
      description="Search will be connected to the car inventory and filter system in the next data pass."
      icon="search"
    />
  );
}
