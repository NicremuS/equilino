import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db.server';
import type { Notice } from '@/types';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const notices = getCollection<Notice>('notices');
  const mine = notices
    .filter(n => n.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(mine);
}
