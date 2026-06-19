import HomeScreen from "@/components/home/HomeScreen";
import { getAuthenticatedProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home - Qent",
  description: "Find and rent premium cars with Qent.",
};

export default async function HomePage() {
  const result = await getAuthenticatedProfile();
  return <HomeScreen profile={result?.profile || null} />;
}
