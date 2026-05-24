import { NextRequest, NextResponse } from 'next/server';
import { getById, readDb, writeDb } from '@/lib/db.server';
import { SignContractSchema } from '@/lib/schemas';
import type { DigitalContract, ContractSignature, ContractHistoryEvent, Notification } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const userId = req.headers.get('x-user-id');
  const tenantId = req.headers.get('x-tenant-id');
  if (!userId || !tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const contract = getById<DigitalContract>('digital_contracts', id);
  if (!contract) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (contract.tenantId !== tenantId) return NextResponse.json({ error: 'Proibido' }, { status: 403 });

  if (!['sent', 'viewed', 'awaiting_signature'].includes(contract.status)) {
    return NextResponse.json({ error: 'Contrato não está disponível para assinatura' }, { status: 409 });
  }

  const alreadySigned = contract.signatures.some(s => s.signerRole === 'tenant');
  if (alreadySigned) {
    return NextResponse.json({ error: 'Você já assinou este contrato' }, { status: 409 });
  }

  const body = await req.json();
  const result = SignContractSchema.safeParse({ ...body, signerRole: 'tenant' });
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }

  const now = new Date().toISOString();
  const db = readDb();
  const users = (db.users ?? []) as { id: string; name: string; email: string }[];
  const signer = users.find(u => u.id === userId);

  const signature: ContractSignature = {
    id: crypto.randomUUID(),
    contractId: id,
    signerName: signer?.name ?? contract.tenantName ?? 'Inquilino',
    signerEmail: signer?.email ?? contract.tenantEmail ?? '',
    signerRole: 'tenant',
    signatureData: result.data.signatureData,
    signedAt: now,
  };

  const newSignatures = [...contract.signatures, signature];
  const landlordSigned = newSignatures.some(s => s.signerRole === 'landlord');
  const newStatus: DigitalContract['status'] = landlordSigned ? 'completed' : 'signed_tenant';
  const completedAt = landlordSigned ? now : contract.completedAt;

  const historyEvent: ContractHistoryEvent = {
    id: crypto.randomUUID(),
    contractId: id,
    type: 'signed',
    description: `Contrato assinado por ${signature.signerName} (Locatário)`,
    userId,
    userName: signature.signerName,
    timestamp: now,
  };

  // Notify landlord
  const notification: Notification = {
    id: crypto.randomUUID(),
    type: 'contract',
    title: '✍️ Inquilino assinou o contrato',
    message: `${signature.signerName} assinou "${contract.title}". ${landlordSigned ? 'Contrato concluído!' : 'Aguardando sua assinatura.'}`,
    read: false,
    createdAt: now,
    relatedId: id,
    priority: 'high',
  };

  const idx = (db.digital_contracts as DigitalContract[]).findIndex(c => c.id === id);
  if (idx !== -1) {
    const c = db.digital_contracts[idx] as DigitalContract;
    c.signatures = newSignatures;
    c.status = newStatus;
    c.signedByTenantAt = now;
    if (completedAt) c.completedAt = completedAt;
    c.updatedAt = now;
    c.history = [...(c.history ?? []), historyEvent];
  }
  (db.notifications as Notification[]).push(notification);
  writeDb(db);

  return NextResponse.json({ ok: true, status: newStatus, signedAt: now });
}
