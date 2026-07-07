import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

type LoginUserRow = {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
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
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password fields are required' },
        { status: 400 }
      );
    }

    const emailClean = email.toLowerCase().trim();

    const res = await query<LoginUserRow>(
      `SELECT id, full_name, email, password_hash, phone, profile_image, address, date_of_birth, role, is_verified, created_at
       FROM users WHERE email = $1`,
      [emailClean]
    );
    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await signJWT({
      userId: String(user.id),
      email: user.email,
      name: user.full_name,
      role: user.role,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('Login API: Cookie set successfully with token for user:', user.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        profile_image: user.profile_image,
        address: user.address,
        date_of_birth: user.date_of_birth,
        role: user.role,
        is_verified: user.is_verified,
        created_at: user.created_at,
      },
    });

    // Also set cookie on the response for extra reliability
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: unknown) {

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Something went wrong' }, { status: 500 });
  }
}
