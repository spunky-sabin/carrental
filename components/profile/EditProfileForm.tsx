"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  AppScreen,
  Icon,
  UserAvatar,
  appStyles,
} from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxImageSize = 1024 * 1024;

export default function EditProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [email, setEmail] = useState(profile.email);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber);
  const [profileImage, setProfileImage] = useState<string | null>(profile.profileImage);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const previewProfile: UserProfile = {
    ...profile,
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" ") || profile.fullName,
    email,
    phoneNumber,
    profileImage,
  };

  const validate = () => {
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    if (!email.trim()) return "Email is required.";
    if (!emailPattern.test(email.trim())) return "Enter a valid email address.";
    if (!phoneNumber.trim()) return "Phone number is required.";
    if (phoneNumber.replace(/[^\d+]/g, "").length < 7) return "Enter a valid phone number.";
    return "";
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Choose a valid image file.");
      return;
    }

    if (file.size > maxImageSize) {
      setError("Choose an image smaller than 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // TODO: Replace this data URL placeholder with object storage upload when storage infrastructure is available.
      setProfileImage(String(reader.result));
      setError("");
    };
    reader.onerror = () => setError("Could not read the selected image.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phoneNumber,
          profileImage,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setSuccess("Profile updated successfully.");
      router.refresh();
      window.setTimeout(() => router.replace("/profile?updated=1"), 650);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen withNav={false} profile={profile} requireAuth={true}>
      <div className={appStyles.pageTitleRow}>
        <Link href="/profile" className={appStyles.roundButton} aria-label="Back to profile">
          <Icon name="back" />
        </Link>
        <h1 className={appStyles.pageTitle}>Edit Profile</h1>
        <span style={{ width: 44 }} />
      </div>

      <form className={appStyles.formCard} onSubmit={handleSubmit}>
        <section className={appStyles.imagePicker}>
          <UserAvatar profile={previewProfile} size="large" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className={appStyles.primaryPill}
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
          >
            <Icon name="camera" size={18} />
            Change profile image
          </button>
          {profileImage ? (
            <button type="button" className={appStyles.viewAll} onClick={() => setProfileImage(null)} disabled={saving}>
              Remove image
            </button>
          ) : null}
        </section>

        {error ? <div className={appStyles.alert}>{error}</div> : null}
        {success ? <div className={appStyles.success}>{success}</div> : null}

        <div className={appStyles.fieldGrid}>
          <div className={appStyles.field}>
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              disabled={saving}
              autoComplete="given-name"
            />
          </div>
          <div className={appStyles.field}>
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              disabled={saving}
              autoComplete="family-name"
            />
          </div>
          <div className={appStyles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={saving}
              autoComplete="email"
            />
          </div>
          <div className={appStyles.field}>
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              disabled={saving}
              autoComplete="tel"
            />
          </div>
        </div>

        <button type="submit" className={appStyles.primaryPill} disabled={saving} style={{ width: "100%", marginTop: 22 }}>
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </AppScreen>
  );
}
