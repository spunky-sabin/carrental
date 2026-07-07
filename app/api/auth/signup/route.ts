import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

type SignupUserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  address: string | null;
  created_at: string;
};

export async function POST(request: Request) {
  try {
    const { name, email, password, country } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const emailClean = email.toLowerCase().trim();

  
    const userCheck = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [emailClean]);
    if (userCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);


    const newUser = await query<SignupUserRow>(
      `INSERT INTO users (full_name, email, phone, password_hash, address, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, full_name, email, phone, role, address, created_at`,
      [
        name.trim(),
        emailClean,
        null,
        passwordHash,
        country?.trim() || null,
        'user',
        true,
      ]
    );

    const user = newUser.rows[0];

    
    const token = await signJWT({
      userId: String(user.id),
      email: user.email,
      name: user.full_name,
      role: user.role,
    });

    
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, 
      path: '/',
    });

    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}
