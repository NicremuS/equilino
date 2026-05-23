import { NextRequest, NextResponse } from 'next/server';
import { getById, updateItem, createItem, getCollection } from '@/lib/db.server';
import type { Payment, Notification, Tenant, Property } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const payment = getById<Payment>('payments', id);
  if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
  if (payment.status !== 'awaiting_approval') {
    return NextResponse.json({ error: 'Pagamento não está aguardando aprovação' }, { status: 422 });
  }

  const now = new Date().toISOString();
  const updated = updateItem<Payment>('payments', id, {
    status:     'paid',
    paidDate:   now,
    approvedBy: userId,
    approvedAt: now,
  });

  const tenant   = getCollection<Tenant>('tenants').find(t => t.id === payment.tenantId);
  const property = getCollection<Property>('properties').find(p => p.id === payment.propertyId);
  const amountStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount);

  createItem<Notification>('notifications', {
    id:        crypto.randomUUID(),
    type:      'payment',
    title:     'Pagamento aprovado',
    message:   `Pagamento de ${amountStr} de ${tenant?.name ?? 'Inquilino'} (${property?.name ?? 'imóvel'}) foi aprovado e registrado.`,
    read:      false,
    createdAt: now,
    relatedId: id,
    priority:  'low',
  });

  return NextResponse.json(updated);
}
