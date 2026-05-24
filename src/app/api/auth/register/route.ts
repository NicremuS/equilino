import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { RegisterSchema } from '@/lib/schemas';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import { readDb, writeDb, getCollection } from '@/lib/db.server';
import { randomUUID } from 'crypto';
import type { User } from '@/types';

interface StoredUser extends User {
  password?: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = RegisterSchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues?.[0]?.message ?? result.error.message ?? 'Dados inválidos';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { name, email, phone, cpf, password } = result.data;

  const users = getCollection<StoredUser>('users');
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const newUser: StoredUser = {
    id: randomUUID(),
    name,
    email,
    phone,
    cpf,
    role: 'owner',
    plan: 'basic',
    subscriptionStatus: 'trial',
    onboardingCompleted: false,
    trialEndsAt,
    createdAt: now.toISOString(),
    password: passwordHash,
  };

  const db = readDb();
  (db.users as StoredUser[]).push(newUser);
  writeDb(db);

  const { password: _pw, ...safeUser } = newUser;

  const tokenPayload = {
    sub: newUser.id,
    email: newUser.email,
    role: newUser.role,
    subscriptionStatus: newUser.subscriptionStatus,
  };

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(tokenPayload),
    signRefreshToken(newUser.id),
  ]);

  const res = NextResponse.json(
    { user: safeUser, accessToken, mustChangePassword: false },
    { status: 201 }
  );
  res.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
