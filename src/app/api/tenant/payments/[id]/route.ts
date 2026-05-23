import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCollection, updateItem, createItem } from '@/lib/db.server';
import type { Payment, Tenant, Property, Notification } from '@/types';

const ReceiptSchema = z.object({
  receiptData: z.string().min(1),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const { id } = await params;
  const payments = getCollection<Payment>('payments');
  const payment = payments.find(p => p.id === id);

  if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
  if (payment.tenantId !== tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const body = await req.json();
  const result = ReceiptSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 });

  const updated = updateItem<Payment>('payments', id, { receiptUrl: result.data.receiptData });

  const tenant = getCollection<Tenant>('tenants').find(t => t.id === tenantId);
  const property = getCollection<Property>('properties').find(p => p.id === payment.propertyId);
  const amountStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount);
  const notification: Notification = {
    id: crypto.randomUUID(),
    type: 'payment',
    title: 'Comprovante de pagamento enviado',
    message: `${tenant?.name ?? 'Inquilino'} enviou o comprovante de ${amountStr} referente a ${payment.month} em ${property?.name ?? 'imóvel'}.`,
    read: false,
    createdAt: new Date().toISOString(),
    relatedId: payment.id,
    priority: 'medium',
  };
  createItem<Notification>('notifications', notification);

  return NextResponse.json(updated);
}
