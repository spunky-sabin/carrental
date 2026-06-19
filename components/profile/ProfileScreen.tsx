"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AppScreen,
  BrandLogo,
  Icon,
  Modal,
  UserAvatar,
  appStyles,
} from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";

const menuItems = [
  { label: "General", href: "/profile", icon: "user" },
  { label: "Favorite Cars", href: "/profile/favorite-cars", icon: "heart" },
  { label: "Previous Rent", href: "/profile/previous-rent", icon: "clock" },
  { label: "Notifications", href: "/notifications", icon: "bell" },
  { label: "Connected Partnerships", href: "/profile/connected-partnerships", icon: "briefcase" },
  { label: "Support", href: "/profile/support", icon: "support" },
  { label: "Settings", href: "/profile/settings", icon: "settings" },
  { label: "Languages", href: "/profile/languages", icon: "language" },
  { label: "Invite Friends", href: "/profile/invite-friends", icon: "friends" },
  { label: "Privacy Policy", href: "/profile/privacy-policy", icon: "privacy" },
  { label: "Help Support", href: "/profile/help-support", icon: "support" },
] as const;

export default function ProfileScreen({
  profile,
  successMessage,
}: {
  profile: UserProfile;
  successMessage?: string;
}) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setLogoutLoading(true);
    setLogoutError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to logout.");
      }

      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/");
    } catch (error: unknown) {
      setLogoutError(error instanceof Error ? error.message : "Failed to logout. Please try again.");
      setLogoutLoading(false);
    }
  };

  return (
    <AppScreen profile={profile} requireAuth={true}>
      <div className={appStyles.pageTitleRow}>
        <BrandLogo />
        <Link href="/profile/edit" className={appStyles.primaryPill}>
          <Icon name="edit" size={18} />
          Edit
        </Link>
      </div>

      {successMessage ? <div className={appStyles.success}>{successMessage}</div> : null}
      {logoutError ? <div className={appStyles.alert}>{logoutError}</div> : null}

      <section className={appStyles.profileHero}>
        <UserAvatar profile={profile} size="large" />
        <h1 className={appStyles.profileName}>{profile.fullName}</h1>
        <p className={appStyles.profileEmail}>{profile.email}</p>
      </section>

      <nav className={appStyles.menuList} aria-label="Profile menu">
        {menuItems.map((item) => (
          <Link key={item.label} href={item.href} className={appStyles.menuItem}>
            <span className={appStyles.menuIcon}>
              <Icon name={item.icon} size={20} />
            </span>
            <span className={appStyles.menuLabel}>{item.label}</span>
            <Icon name="chevron" size={19} />
          </Link>
        ))}

        <button type="button" className={appStyles.menuItem} onClick={() => setLogoutOpen(true)}>
          <span className={appStyles.menuIcon}>
            <Icon name="logout" size={20} />
          </span>
          <span className={appStyles.menuLabel}>Logout</span>
          <Icon name="chevron" size={19} />
        </button>
      </nav>

      {logoutOpen ? (
        <Modal
          title="Are you sure you want to logout?"
          description="Your current authentication session and local auth state will be cleared."
          confirmLabel="Logout"
          cancelLabel="Cancel"
          danger
          loading={logoutLoading}
          onConfirm={handleLogout}
          onCancel={() => setLogoutOpen(false)}
        />
      ) : null}
    </AppScreen>
  );
}
