import { NextRequest, NextResponse } from 'next/server';
import { getById, readDb, writeDb } from '@/lib/db.server';
import type { DigitalContract, ContractHistoryEvent, Notification } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const contract = getById<DigitalContract>('digital_contracts', id);
  if (!contract) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (contract.landlordId !== userId) return NextResponse.json({ error: 'Proibido' }, { status: 403 });
  if (!['draft', 'pending_review'].includes(contract.status)) {
    return NextResponse.json({ error: 'Contrato já foi enviado' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const db = readDb();
  const users = (db.users ?? []) as { id: string; name: string }[];
  const sender = users.find(u => u.id === userId);

  const historyEvent: ContractHistoryEvent = {
    id: crypto.randomUUID(),
    contractId: id,
    type: 'sent',
    description: `Contrato enviado para assinatura por ${sender?.name ?? 'Proprietário'}`,
    userId,
    userName: sender?.name ?? 'Proprietário',
    timestamp: now,
  };

  // Tenant notification
  const notification: Notification = {
    id: crypto.randomUUID(),
    type: 'contract',
    title: '📄 Novo contrato para assinar',
    message: `${sender?.name ?? 'Seu locador'} enviou "${contract.title}" para você revisar e assinar. Acesse para visualizar.`,
    read: false,
    createdAt: now,
    relatedId: id,
    priority: 'high',
    targetTenantId: contract.tenantId,
  };

  const idx = (db.digital_contracts as DigitalContract[]).findIndex(c => c.id === id);
  if (idx !== -1) {
    const c = db.digital_contracts[idx] as DigitalContract;
    c.status = 'sent';
    c.sentAt = now;
    c.expiresAt = expiresAt;
    c.updatedAt = now;
    c.history = [...c.history, historyEvent];
  }
  (db.notifications as Notification[]).push(notification);
  writeDb(db);

  return NextResponse.json({ ok: true, sentAt: now, expiresAt });
}
