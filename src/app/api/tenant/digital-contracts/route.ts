import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db.server';
import type { DigitalContract } from '@/types';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const contracts = getCollection<DigitalContract>('digital_contracts')
    .filter(c => c.tenantId === tenantId && c.status !== 'draft')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json(contracts);
}
