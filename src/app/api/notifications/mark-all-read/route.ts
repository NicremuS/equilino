import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db.server';
import type { Notification } from '@/types';

export async function PATCH() {
  const db = readDb();
  (db.notifications as Notification[]).forEach((n) => { n.read = true; });
  writeDb(db);
  return NextResponse.json({ ok: true });
}
