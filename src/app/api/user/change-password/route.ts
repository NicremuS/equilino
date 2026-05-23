import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCollection, updateItem } from '@/lib/db.server';

interface StoredUser {
  id: string;
  password?: string;
}

const Schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres').max(128),
});

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const result = Schema.safeParse(body);
  if (!result.success) {
    const msg = Object.values(result.error.flatten().fieldErrors).flat()[0] ?? 'Dados inválidos';
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const users = getCollection<StoredUser>('users');
  const user = users.find(u => u.id === userId);
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const stored = user.password ?? '';
  const { currentPassword, newPassword } = result.data;

  let valid = false;
  if (stored.startsWith('$2')) {
    const { compare } = await import('bcryptjs');
    valid = await compare(currentPassword, stored);
  } else {
    valid = stored === currentPassword;
  }

  if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 403 });
  if (currentPassword === newPassword) return NextResponse.json({ error: 'A nova senha deve ser diferente da atual' }, { status: 422 });

  updateItem<StoredUser>('users', userId, { password: newPassword });
  return NextResponse.json({ ok: true });
}
