import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

type GoogleUserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  address: string | null;
  date_of_birth: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
};

export async function POST(request: Request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential is required' },
        { status: 400 }
      );
    }

    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!googleRes.ok) {
      return NextResponse.json(
        { error: 'Failed to verify Google token' },
        { status: 400 }
      );
    }

    const payload = await googleRes.json();
    const { email, name, picture, given_name, family_name } = payload;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not returned by Google' },
        { status: 400 }
      );
    }

    const emailClean = email.toLowerCase().trim();
    const fullName = name || [given_name, family_name].filter(Boolean).join(' ') || emailClean.split('@')[0];

    let user;
    const userCheck = await query<GoogleUserRow>(
      `SELECT id, full_name, email, phone, profile_image, address, date_of_birth, role, is_verified, created_at
       FROM users WHERE email = $1`,
      [emailClean]
    );

    if (userCheck.rows.length > 0) {
      if (picture && userCheck.rows[0].profile_image !== picture) {
        const updated = await query<GoogleUserRow>(
          `UPDATE users SET profile_image = $1 WHERE id = $2
           RETURNING id, full_name, email, phone, profile_image, address, date_of_birth, role, is_verified, created_at`,
          [picture, userCheck.rows[0].id]
        );
        user = updated.rows[0];
      } else {
        user = userCheck.rows[0];
      }
    } else {
      const tempPassword = `google-oauth-${Math.random().toString(36).substring(2)}-${Date.now()}`;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(tempPassword, salt);

      const newUser = await query<GoogleUserRow>(
        `INSERT INTO users (full_name, email, phone, password_hash, profile_image, role, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, full_name, email, phone, profile_image, address, date_of_birth, role, is_verified, created_at`,
        [fullName, emailClean, null, passwordHash, picture || null, 'user', true]
      );
      user = newUser.rows[0];
    }

     
    const token = await signJWT({
      userId: String(user.id),
      email: user.email,
      name: user.full_name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        ...user,
        userId: user.id,
        name: user.full_name || user.email,
      },
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Google auth failed:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}
