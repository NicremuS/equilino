import { NextRequest, NextResponse } from 'next/server';
import { getById, readDb, writeDb } from '@/lib/db.server';
import type { DigitalContract } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const contract = getById<DigitalContract>('digital_contracts', id);
  if (!contract) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (contract.tenantId !== tenantId) return NextResponse.json({ error: 'Proibido' }, { status: 403 });

  // Increment view and update status
  const now = new Date().toISOString();
  const db = readDb();
  const idx = (db.digital_contracts as DigitalContract[]).findIndex(c => c.id === id);
  if (idx !== -1) {
    const c = db.digital_contracts[idx] as DigitalContract;
    c.viewCount = (c.viewCount ?? 0) + 1;
    if (!c.viewedAt) c.viewedAt = now;
    if (c.status === 'sent') c.status = 'viewed';
    writeDb(db);
    return NextResponse.json(c);
  }

  return NextResponse.json(contract);
}
