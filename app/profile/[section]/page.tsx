import { notFound, redirect } from "next/navigation";
import { PlaceholderScreen } from "@/components/app/AppUI";
import { getAuthenticatedProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

const profileSections = {
  "favorite-cars": {
    title: "Favorite Cars",
    description: "Saved cars will appear here once favorites are connected to the database.",
    icon: "heart",
  },
  "previous-rent": {
    title: "Previous Rent",
    description: "Completed rental history will be shown after booking records are implemented.",
    icon: "clock",
  },
  "connected-partnerships": {
    title: "Connected Partnerships",
    description: "Partner connections are a placeholder until partnership integrations are added.",
    icon: "briefcase",
  },
  support: {
    title: "Support",
    description: "Support routing is available as a placeholder from the profile menu.",
    icon: "support",
  },
  settings: {
    title: "Settings",
    description: "Account settings will be connected to real preferences in a later pass.",
    icon: "settings",
  },
  languages: {
    title: "Languages",
    description: "Language preferences are ready for localization support.",
    icon: "language",
  },
  "invite-friends": {
    title: "Invite Friends",
    description: "Referral invites will be enabled once sharing links are available.",
    icon: "friends",
  },
  "privacy-policy": {
    title: "Privacy Policy",
    description: "Policy content can be added here when legal copy is finalized.",
    icon: "privacy",
  },
  "help-support": {
    title: "Help Support",
    description: "Help topics and support tickets will live here when support data is connected.",
    icon: "support",
  },
} as const;

export default async function ProfileSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const result = await getAuthenticatedProfile();

  if (!result) {
    redirect("/");
  }

  const { section } = await params;
  const content = profileSections[section as keyof typeof profileSections];

  if (!content) {
    notFound();
  }

  return (
    <PlaceholderScreen
      profile={result.profile}
      title={content.title}
      description={content.description}
      icon={content.icon}
    />
  );
}
