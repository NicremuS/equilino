import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { CreateTicketSchema } from '@/lib/schemas';
import type { MaintenanceTicket } from '@/types';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const tickets = getCollection<MaintenanceTicket>('tickets');
  const myTickets = tickets
    .filter(t => t.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(myTickets);
}

export async function POST(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const body = await req.json();
  const result = CreateTicketSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }

  const now = new Date().toISOString();
  const ticket: MaintenanceTicket = {
    ...result.data,
    id: crypto.randomUUID(),
    tenantId,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };

  createItem<MaintenanceTicket>('tickets', ticket);
  return NextResponse.json(ticket, { status: 201 });
}
