import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { TicketSchema } from '@/lib/schemas';
import type { MaintenanceTicket } from '@/types';

export async function GET() {
  return NextResponse.json(getCollection<MaintenanceTicket>('tickets'));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = TicketSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }
  const item: MaintenanceTicket = { ...result.data, id: crypto.randomUUID() };
  createItem('tickets', item);
  return NextResponse.json(item, { status: 201 });
}
