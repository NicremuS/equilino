import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCollection, updateItem } from '@/lib/db.server';
import type { User } from '@/types';

interface StoredUser extends User {
  password?: string;
  tenantId?: string;
}

const UpdateProfileSchema = z.object({
  name:  z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120).trim(),
  email: z.string().email('Email inválido').max(254).toLowerCase().trim(),
});

export async function PATCH(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const result = UpdateProfileSchema.safeParse(body);
  if (!result.success) {
    const msg = Object.values(result.error.flatten().fieldErrors).flat()[0] ?? 'Dados inválidos';
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const users = getCollection<StoredUser>('users');
  const user = users.find(u => u.id === userId);
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const { name, email } = result.data;

  // Check email uniqueness if changed
  if (email !== user.email) {
    const emailTaken = users.some(u => u.id !== userId && u.email === email);
    if (emailTaken) return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 });
  }

  const updated = updateItem<StoredUser>('users', userId, { name, email });
  if (!updated) return NextResponse.json({ error: 'Falha ao atualizar perfil' }, { status: 500 });

  const { password: _pw, ...safeUser } = updated;
  return NextResponse.json({ user: safeUser });
}
