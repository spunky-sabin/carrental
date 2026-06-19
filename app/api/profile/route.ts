import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, signJWT } from "@/lib/auth";
import { query } from "@/lib/db";
import { getFullName, mapUserRowToProfile, validateProfileInput, type UserRow } from "@/lib/profile";

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const result = await query<UserRow>(
      `SELECT id, full_name, email, phone, profile_image, created_at, role
       FROM users
       WHERE id = $1`,
      [session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json({ profile: mapUserRowToProfile(result.rows[0]) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const parsed = validateProfileInput(await request.json());

    if (!parsed.valid) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { firstName, lastName, email, phoneNumber, profileImage } = parsed.value;
    const duplicate = await query<{ id: string }>(
      `SELECT id
       FROM users
       WHERE email = $1 AND id <> $2`,
      [email, session.userId]
    );

    if (duplicate.rows.length > 0) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const fullName = getFullName(firstName, lastName);
    const updated = await query<UserRow>(
      `UPDATE users
       SET full_name = $1, email = $2, phone = $3, profile_image = $4
       WHERE id = $5
       RETURNING id, full_name, email, phone, profile_image, created_at, role`,
      [fullName, email, phoneNumber, profileImage, session.userId]
    );

    if (updated.rows.length === 0) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const user = updated.rows[0];
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.full_name || fullName,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      profile: {
        ...mapUserRowToProfile(user),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
