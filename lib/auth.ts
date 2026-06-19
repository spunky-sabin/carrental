import { SignJWT, jwtVerify, decodeJwt, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'random'
);

export type SessionPayload = JWTPayload & {
  userId: string;
  email: string;
  name?: string;
  role?: string;
};

export async function signJWT(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Accept numeric userId (DB integer) or string, normalize to string
    const rawUserId = (payload as any).userId;
    const rawEmail = (payload as any).email;
    if ((typeof rawUserId !== 'string' && typeof rawUserId !== 'number') || typeof rawEmail !== 'string') {
      return null;
    }

    // Normalize types
    const normalized: SessionPayload = {
      ...(payload as SessionPayload),
      userId: String(rawUserId),
      email: String(rawEmail),
    };

    return normalized;
  } catch (error) {
    console.error('JWT verification failed:', error instanceof Error ? error.message : error);
    try {
      const decoded = decodeJwt(token);
      console.log('Decoded JWT (unverified):', decoded);
    } catch (decodeError) {
      console.log('Failed to decode JWT:', decodeError instanceof Error ? decodeError.message : decodeError);
    }
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  console.log('getSessionUser: All cookies available:', cookieStore.getAll());
  console.log('getSessionUser: Session token value:', token ? 'exists' : 'not found');

  if (!token) {
    console.log('No session token found in cookies');
    return null;
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    console.log('JWT verification failed');
    return null;
  }

  console.log('JWT verification successful, payload:', payload);
  return payload;
}
