import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

type MeUserRow = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  profile_image: string | null;
  address: string | null;
  date_of_birth: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
};

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const res = await query<MeUserRow>(
      `SELECT id, full_name, email, phone, profile_image, address, date_of_birth, role, is_verified, created_at
       FROM users WHERE id = $1`,
      [session.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({ authenticated: true, user: res.rows[0] });
  } catch {

    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}
