import { NextRequest, NextResponse } from 'next/server';
import { updateItem } from '@/lib/db.server';
import type { Notice } from '@/types';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const { id } = await params;
  const updated = updateItem<Notice>('notices', id, { read: true });
  if (!updated) return NextResponse.json({ error: 'Aviso não encontrado' }, { status: 404 });

  return NextResponse.json(updated);
}
