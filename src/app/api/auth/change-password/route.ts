import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { getCollection, updateItem } from '@/lib/db.server';

interface StoredUser {
  id: string;
  password?: string;
}

const ChangePasswordSchema = z.object({
  newPassword: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(128),
});

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const result = ChangePasswordSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors.newPassword?.[0] ?? 'Dados inválidos' }, { status: 422 });
  }

  const users = getCollection<StoredUser>('users');
  const user = users.find(u => u.id === userId);
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const current = user.password ?? '';
  const isDefault = current.startsWith('$2')
    ? await compare('123456', current)
    : current === '123456';

  if (!isDefault) {
    return NextResponse.json({ error: 'Esta ação só é permitida na primeira alteração de senha.' }, { status: 403 });
  }

  updateItem<StoredUser>('users', userId, { password: result.data.newPassword });

  return NextResponse.json({ ok: true });
}
