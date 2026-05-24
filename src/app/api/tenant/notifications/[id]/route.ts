import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db.server';
import type { Notification } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const { id } = await params;
  const db = readDb();
  const notifications = db.notifications as Notification[];
  const notif = notifications.find(n => n.id === id && n.targetTenantId === tenantId);
  if (!notif) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  notif.read = true;
  writeDb(db as Parameters<typeof writeDb>[0]);
  return NextResponse.json(notif);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const { id } = await params;
  const db = readDb();
  const notifications = db.notifications as Notification[];
  const idx = notifications.findIndex(n => n.id === id && n.targetTenantId === tenantId);
  if (idx === -1) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  notifications.splice(idx, 1);
  writeDb(db as Parameters<typeof writeDb>[0]);
  return NextResponse.json({ ok: true });
}
