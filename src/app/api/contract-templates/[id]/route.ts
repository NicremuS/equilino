import { NextRequest, NextResponse } from 'next/server';
import { getById, updateItem, deleteItem } from '@/lib/db.server';
import { CreateTemplateSchema } from '@/lib/schemas';
import type { ContractTemplate } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const t = getById<ContractTemplate>('contract_templates', id);
  if (!t) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(t);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const userRole = req.headers.get('x-user-role');
  if (userRole === 'tenant') return NextResponse.json({ error: 'Proibido' }, { status: 403 });

  const t = getById<ContractTemplate>('contract_templates', id);
  if (!t) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (t.isBuiltIn) return NextResponse.json({ error: 'Templates padrão não podem ser editados' }, { status: 409 });

  const body = await req.json();
  const result = CreateTemplateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 422 });

  const updated = updateItem<ContractTemplate>('contract_templates', id, {
    ...result.data,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const t = getById<ContractTemplate>('contract_templates', id);
  if (!t) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (t.isBuiltIn) return NextResponse.json({ error: 'Templates padrão não podem ser deletados' }, { status: 409 });
  deleteItem('contract_templates', id);
  return new NextResponse(null, { status: 204 });
}
