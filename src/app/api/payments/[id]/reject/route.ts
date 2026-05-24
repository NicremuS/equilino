import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getById, updateItem, createItem, getCollection } from '@/lib/db.server';
import type { Payment, Notification, Tenant, Property } from '@/types';

const RejectSchema = z.object({
  reason: z.string().min(5, 'Informe o motivo com pelo menos 5 caracteres').max(500),
});

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

  const body = await req.json();
  const result = RejectSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors.reason?.[0] ?? 'Dados inválidos' }, { status: 422 });
  }

  const now = new Date().toISOString();
  const updated = updateItem<Payment>('payments', id, {
    status:          'rejected',
    rejectionReason: result.data.reason,
    approvedBy:      userId,
    approvedAt:      now,
  });

  const tenant   = getCollection<Tenant>('tenants').find(t => t.id === payment.tenantId);
  const property = getCollection<Property>('properties').find(p => p.id === payment.propertyId);
  const amountStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount);

  // Landlord notification
  createItem<Notification>('notifications', {
    id:        crypto.randomUUID(),
    type:      'alert',
    title:     'Comprovante rejeitado',
    message:   `O comprovante de ${tenant?.name ?? 'Inquilino'} referente a ${amountStr} (${property?.name ?? 'imóvel'}) foi rejeitado. Motivo: ${result.data.reason}`,
    read:      false,
    createdAt: now,
    relatedId: id,
    priority:  'high',
  });

  // Tenant notification
  createItem<Notification>('notifications', {
    id:             crypto.randomUUID(),
    type:           'alert',
    title:          'Comprovante rejeitado',
    message:        `Seu comprovante de ${amountStr} (${payment.month}) foi rejeitado. Motivo: ${result.data.reason}. Envie um novo comprovante.`,
    read:           false,
    createdAt:      now,
    relatedId:      id,
    priority:       'high',
    targetTenantId: payment.tenantId,
  });

  return NextResponse.json(updated);
}
