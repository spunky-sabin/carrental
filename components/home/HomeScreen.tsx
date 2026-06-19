"use client";

import { AppScreen } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";

export default function HomeScreen({ profile }: { profile: UserProfile | null }) {
  return (
    <AppScreen profile={profile}>
      <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 60, minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 48 }}></span>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#0f172a" }}>Qent Premium Car Sharing</h1>
        </div>
      </div>
    </AppScreen>
  );
}
