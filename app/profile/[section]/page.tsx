import { notFound, redirect } from "next/navigation";
import { AppScreen, CarsScroller, PlaceholderScreen } from "@/components/app/AppUI";
import { getCars } from "@/components/app/queries";
import { query } from "@/lib/db";
import { ensureOwnerSchema } from "@/lib/owner";
import { getAuthenticatedProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

const profileSections = {
  "favorite-cars": {
    title: "Favorite Cars",
    description: "Cars you saved for quick access.",
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

  if (section === "favorite-cars") {
    await ensureOwnerSchema();
    const favoritesResult = await query<{ car_id: number }>(
      "SELECT car_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC",
      [result.profile.id]
    );
    const favoriteIds = new Set(favoritesResult.rows.map((row) => row.car_id));
    const cars = (await getCars()).filter((car) => favoriteIds.has(car.id));

    return (
      <AppScreen profile={result.profile} requireAuth>
        <div className="responsive-form-shell">
          <div className="responsive-form-card">
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>{content.title}</h1>
            <p style={{ margin: "8px 0 22px", color: "#64748b", fontWeight: 700 }}>{content.description}</p>
            {cars.length > 0 ? <CarsScroller cars={cars} /> : <p style={{ color: "#64748b", fontWeight: 700 }}>No saved cars yet.</p>}
          </div>
        </div>
      </AppScreen>
    );
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
