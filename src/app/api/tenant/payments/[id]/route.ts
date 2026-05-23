import { NextRequest, NextResponse } from 'next/server';
import { getCollection, updateItem, createItem } from '@/lib/db.server';
import { ReceiptSubmissionSchema } from '@/lib/schemas';
import type { Payment, Tenant, Property, Notification } from '@/types';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const { id } = await params;
  const payments = getCollection<Payment>('payments');
  const payment  = payments.find(p => p.id === id);

  if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
  if (payment.tenantId !== tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const canSubmit = ['pending', 'overdue', 'partial', 'rejected'].includes(payment.status);
  if (!canSubmit) return NextResponse.json({ error: 'Comprovante não pode ser enviado para este pagamento' }, { status: 422 });

  const body = await req.json();
  const result = ReceiptSubmissionSchema.safeParse(body);
  if (!result.success) {
    const msg = Object.values(result.error.flatten().fieldErrors).flat()[0] ?? 'Dados inválidos';
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const now = new Date().toISOString();
  const { receiptData, notes, paymentMethod, paymentDate } = result.data;

  const updated = updateItem<Payment>('payments', id, {
    receiptUrl:    receiptData,
    receiptNotes:  notes,
    paymentMethod,
    paymentDate,
    submittedAt:   now,
    status:        'awaiting_approval',
  });

  // Notify landlord
  const tenant   = getCollection<Tenant>('tenants').find(t => t.id === tenantId);
  const property = getCollection<Property>('properties').find(p => p.id === payment.propertyId);
  const amountStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount);

  const METHOD_PT: Record<string, string> = {
    pix: 'Pix', transfer: 'TED/Transferência', boleto: 'Boleto', cash: 'Dinheiro', other: 'Outro',
  };

  const methodText = paymentMethod ? ` via ${METHOD_PT[paymentMethod] ?? paymentMethod}` : '';
  const notesText  = notes ? ` — "${notes}"` : '';

  createItem<Notification>('notifications', {
    id:        crypto.randomUUID(),
    type:      'payment',
    title:     'Comprovante enviado — aguardando aprovação',
    message:   `${tenant?.name ?? 'Inquilino'} enviou comprovante de ${amountStr}${methodText} referente a ${payment.month} em ${property?.name ?? 'imóvel'}${notesText}. Acesse para aprovar ou rejeitar.`,
    read:      false,
    createdAt: now,
    relatedId: id,
    priority:  'high',
  });

  return NextResponse.json(updated);
}
