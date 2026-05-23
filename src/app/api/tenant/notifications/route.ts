import { NextRequest, NextResponse } from 'next/server';
import { getCollection, readDb, writeDb } from '@/lib/db.server';
import { checkAndCreateRentReminders, shouldRunCheck } from '@/lib/rentReminders.server';
import type { Notification } from '@/types';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  // Piggyback: opportunistically create rent reminders if cooldown allows
  if (shouldRunCheck(tenantId)) {
    checkAndCreateRentReminders(tenantId);
  }

  const all = getCollection<Notification>('notifications');
  const mine = all.filter(n => n.targetTenantId === tenantId);
  const sorted = [...mine].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return NextResponse.json(sorted);
}

// Mark all as read
export async function PATCH(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const db = readDb();
  const notifications = db.notifications as Notification[];
  let count = 0;
  for (const n of notifications) {
    if (n.targetTenantId === tenantId && !n.read) {
      n.read = true;
      count++;
    }
  }
  if (count > 0) writeDb(db as Parameters<typeof writeDb>[0]);
  return NextResponse.json({ ok: true, count });
}
