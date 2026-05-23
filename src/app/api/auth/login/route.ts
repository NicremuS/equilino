import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { LoginSchema } from '@/lib/schemas';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import { getCollection } from '@/lib/db.server';
import type { User } from '@/types';

interface StoredUser extends User {
  password?: string;
  tenantId?: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = LoginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 400 });
  }

  const { email, password } = result.data;
  const users = getCollection<StoredUser>('users');
  const user = users.find((u) => u.email === email);

  if (!user) {
    return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
  }

  const passwordHash = user.password ?? '';
  const valid = passwordHash.startsWith('$2')
    ? await compare(password, passwordHash)
    : password === passwordHash; // demo mode: plain-text fallback

  if (!valid) {
    return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
  }

  const { password: _pw, ...safeUser } = user;
  const mustChangePassword = passwordHash === '123456';

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    ...(user.tenantId ? { tenantId: user.tenantId } : {}),
  };

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(tokenPayload),
    signRefreshToken(user.id),
  ]);

  const res = NextResponse.json({ user: safeUser, accessToken, mustChangePassword }, { status: 200 });
  res.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}
