import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { NotificationSchema } from '@/lib/schemas';
import type { Notification } from '@/types';

export async function GET() {
  // Exclude tenant-targeted notifications — those belong to the tenant portal
  const all = getCollection<Notification>('notifications');
  return NextResponse.json(all.filter(n => !n.targetTenantId));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const partial = NotificationSchema.omit({ read: true, createdAt: true }).safeParse(body);
  if (!partial.success) {
    return NextResponse.json({ error: partial.error.flatten() }, { status: 422 });
  }
  const item: Notification = {
    ...partial.data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  createItem('notifications', item);
  return NextResponse.json(item, { status: 201 });
}
