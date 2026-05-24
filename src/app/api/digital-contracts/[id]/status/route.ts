import { NextRequest, NextResponse } from 'next/server';
import { getById, readDb, writeDb } from '@/lib/db.server';
import { RejectContractSchema } from '@/lib/schemas';
import type { DigitalContract, ContractHistoryEvent, Notification } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const contract = getById<DigitalContract>('digital_contracts', id);
  if (!contract) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const body = await req.json() as { status: string; reason?: string };
  const newStatus = body.status as DigitalContract['status'];
  const now = new Date().toISOString();

  const db = readDb();
  const users = (db.users ?? []) as { id: string; name: string }[];
  const actor = users.find(u => u.id === userId);

  let description = `Status alterado para: ${newStatus}`;
  let rejectionReason: string | undefined;

  if (newStatus === 'rejected') {
    const parsed = RejectContractSchema.safeParse({ reason: body.reason });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Informe o motivo da rejeição' }, { status: 422 });
    }
    rejectionReason = parsed.data.reason;
    description = `Contrato rejeitado: ${rejectionReason}`;
  }

  if (newStatus === 'cancelled') {
    description = 'Contrato cancelado';
  }

  const historyEvent: ContractHistoryEvent = {
    id: crypto.randomUUID(),
    contractId: id,
    type: newStatus === 'rejected' ? 'rejected' : newStatus === 'cancelled' ? 'cancelled' : 'status_changed',
    description,
    userId,
    userName: actor?.name ?? 'Usuário',
    timestamp: now,
    metadata: rejectionReason ? { reason: rejectionReason } : undefined,
  };

  const patch: Partial<DigitalContract> = {
    status: newStatus,
    updatedAt: now,
    history: [...contract.history, historyEvent],
    ...(rejectionReason ? { rejectionReason } : {}),
  };

  const idx = (db.digital_contracts as DigitalContract[]).findIndex(c => c.id === id);
  if (idx !== -1) Object.assign(db.digital_contracts[idx], patch);

  // Notification on rejection/cancellation
  if (['rejected', 'cancelled'].includes(newStatus)) {
    const notif: Notification = {
      id: crypto.randomUUID(),
      type: 'contract',
      title: newStatus === 'rejected' ? '❌ Contrato rejeitado' : '🚫 Contrato cancelado',
      message: `"${contract.title}" foi ${newStatus === 'rejected' ? 'rejeitado' : 'cancelado'}${rejectionReason ? `: ${rejectionReason}` : ''}.`,
      read: false,
      createdAt: now,
      relatedId: id,
      priority: 'high',
      targetTenantId: contract.tenantId,
    };
    (db.notifications as Notification[]).push(notif);
  }

  writeDb(db);
  return NextResponse.json({ ok: true, status: newStatus });
}
