import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken } from '@/lib/auth';
import { getCollection } from '@/lib/db.server';
import type { User } from '@/types';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('refresh_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Sem refresh token' }, { status: 401 });
  }

  try {
    const { sub } = await verifyRefreshToken(token);
    const users = getCollection<User>('users');
    const user = users.find((u) => u.id === sub);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
    return NextResponse.json({ accessToken });
  } catch {
    return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
  }
}
