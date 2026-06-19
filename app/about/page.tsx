"use client";

import { useEffect, useState } from "react";
import { AppScreen } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";

export default function AboutPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (data.authenticated && data.user) {
          setProfile({
            id: data.user.userId,
            firstName: data.user.name?.split(" ")[0] || "",
            lastName: data.user.name?.split(" ")[1] || "",
            fullName: data.user.name || data.user.email,
            email: data.user.email,
            phoneNumber: "",
            profileImage: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Auth check failed", e);
      }
    }
    checkAuth();
  }, []);

  return (
    <AppScreen profile={profile}>
      <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 60, minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 40 }}></span>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>About Qent</h1>
        </div>
      </div>
    </AppScreen>
  );
}
