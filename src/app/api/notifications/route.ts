import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { NotificationSchema } from '@/lib/schemas';
import type { Notification } from '@/types';

export async function GET() {
  return NextResponse.json(getCollection<Notification>('notifications'));
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
