import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import type { UserProfile } from "@/components/app/types";

export type UserRow = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  profile_image: string | null;
  created_at: string | Date | null;
  role: string;
};

export type ProfileInput = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profileImage: string | null;
};

export type ProfileValidationResult =
  | { valid: true; value: ProfileInput }
  | { valid: false; error: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitFullName(fullName: string | null) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function getFullName(firstName: string, lastName: string) {
  return [firstName, lastName].map((value) => value.trim()).filter(Boolean).join(" ");
}

export function mapUserRowToProfile(row: UserRow): UserProfile {
  const { firstName, lastName } = splitFullName(row.full_name);
  const createdAt = row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString();

  return {
    id: row.id,
    firstName,
    lastName,
    fullName: row.full_name?.trim() || getFullName(firstName, lastName) || row.email,
    email: row.email,
    phoneNumber: row.phone || "",
    profileImage: row.profile_image || null,
    role: row.role || "user",
    createdAt,
    updatedAt: createdAt,
  };
}

export function validateProfileInput(input: Partial<ProfileInput>): ProfileValidationResult {
  const firstName = String(input.firstName || "").trim();
  const lastName = String(input.lastName || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const phoneNumber = String(input.phoneNumber || "").trim();
  const profileImage = input.profileImage ? String(input.profileImage).trim() : null;

  if (!firstName) {
    return { valid: false, error: "First name is required." };
  }

  if (!lastName) {
    return { valid: false, error: "Last name is required." };
  }

  if (!email) {
    return { valid: false, error: "Email is required." };
  }

  if (!emailPattern.test(email)) {
    return { valid: false, error: "Enter a valid email address." };
  }

  if (!phoneNumber) {
    return { valid: false, error: "Phone number is required." };
  }

  if (phoneNumber.replace(/[^\d+]/g, "").length < 7) {
    return { valid: false, error: "Enter a valid phone number." };
  }

  return {
    valid: true,
    value: {
      firstName,
      lastName,
      email,
      phoneNumber,
      profileImage,
    },
  };
}

export async function getAuthenticatedProfile() {
  const session = await getSessionUser();

  if (!session?.userId) {
    console.log('getAuthenticatedProfile: No session or userId found');
    return null;
  }

  console.log('getAuthenticatedProfile: Session found with userId:', session.userId);

  const result = await query<UserRow>(
    `SELECT id, full_name, email, phone, profile_image, created_at, role
     FROM users
     WHERE id = $1`,
    [session.userId]
  );

  if (result.rows.length === 0) {
    console.log('getAuthenticatedProfile: No user found in database for userId:', session.userId);
    return null;
  }

  console.log('getAuthenticatedProfile: User found in database');
  return {
    profile: mapUserRowToProfile(result.rows[0] as UserRow),
    role: String(result.rows[0].role || "user"),
  };
}
