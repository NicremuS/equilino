import { NextRequest, NextResponse } from 'next/server';
import { getById, readDb, writeDb } from '@/lib/db.server';
import { SignContractSchema } from '@/lib/schemas';
import type { DigitalContract, ContractSignature, ContractHistoryEvent, Notification } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const contract = getById<DigitalContract>('digital_contracts', id);
  if (!contract) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const body = await req.json();
  const result = SignContractSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }

  const { signatureData, signerRole } = result.data;

  // Validate signing rights
  if (signerRole === 'landlord' && contract.landlordId !== userId) {
    return NextResponse.json({ error: 'Apenas o proprietário pode assinar como locador' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const db = readDb();
  const users = (db.users ?? []) as { id: string; name: string; email: string }[];
  const signer = users.find(u => u.id === userId);

  // Check already signed
  const alreadySigned = contract.signatures.some(s => s.signerRole === signerRole);
  if (alreadySigned) {
    return NextResponse.json({ error: 'Já foi assinado por este participante' }, { status: 409 });
  }

  const signature: ContractSignature = {
    id: crypto.randomUUID(),
    contractId: id,
    signerName: signer?.name ?? 'Assinante',
    signerEmail: signer?.email ?? '',
    signerRole,
    signatureData,
    signedAt: now,
  };

  const newSignatures = [...contract.signatures, signature];
  const tenantSigned = newSignatures.some(s => s.signerRole === 'tenant');
  const landlordSigned = newSignatures.some(s => s.signerRole === 'landlord');

  let newStatus: DigitalContract['status'] = contract.status;
  let signedByTenantAt = contract.signedByTenantAt;
  let signedByLandlordAt = contract.signedByLandlordAt;
  let completedAt = contract.completedAt;

  if (signerRole === 'tenant') {
    signedByTenantAt = now;
    newStatus = 'signed_tenant';
  } else if (signerRole === 'landlord') {
    signedByLandlordAt = now;
    newStatus = landlordSigned && tenantSigned ? 'completed' : 'signed_landlord';
    if (tenantSigned && landlordSigned) completedAt = now;
  }

  if (tenantSigned && landlordSigned) {
    newStatus = 'completed';
    completedAt = now;
  }

  const historyEvent: ContractHistoryEvent = {
    id: crypto.randomUUID(),
    contractId: id,
    type: 'signed',
    description: `Assinado por ${signature.signerName} (${signerRole === 'landlord' ? 'Locador' : 'Locatário'})`,
    userId,
    userName: signature.signerName,
    timestamp: now,
  };

  const updatedContract: Partial<DigitalContract> = {
    signatures: newSignatures,
    status: newStatus,
    signedByTenantAt,
    signedByLandlordAt,
    completedAt,
    updatedAt: now,
    history: [...contract.history, historyEvent],
  };

  // Create notification for the other party
  const notif: Notification = {
    id: crypto.randomUUID(),
    type: 'contract',
    title: signerRole === 'tenant' ? '✍️ Inquilino assinou o contrato' : '✍️ Contrato assinado pelo locador',
    message: signerRole === 'tenant'
      ? `${signature.signerName} assinou "${contract.title}". Agora é sua vez de assinar.`
      : newStatus === 'completed'
        ? `"${contract.title}" está totalmente assinado e concluído!`
        : `Você assinou "${contract.title}".`,
    read: false,
    createdAt: now,
    relatedId: id,
    priority: 'high',
    ...(signerRole === 'tenant' ? {} : { targetTenantId: contract.tenantId }),
  };

  const idx = (db.digital_contracts as DigitalContract[]).findIndex(c => c.id === id);
  if (idx !== -1) {
    Object.assign(db.digital_contracts[idx], updatedContract);
  }
  (db.notifications as Notification[]).push(notif);
  writeDb(db);

  return NextResponse.json({ ...contract, ...updatedContract });
}
