import { NextRequest, NextResponse } from 'next/server';
import { getById, updateItem, deleteItem, readDb, writeDb } from '@/lib/db.server';
import { UpdateDigitalContractSchema } from '@/lib/schemas';
import type { DigitalContract, ContractHistoryEvent } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const contract = getById<DigitalContract>('digital_contracts', id);
  if (!contract) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  // Track view count (tenant)
  const tenantId = req.headers.get('x-tenant-id');
  if (tenantId && contract.tenantId === tenantId) {
    const now = new Date().toISOString();
    const db = readDb();
    const idx = (db.digital_contracts as DigitalContract[]).findIndex(c => c.id === id);
    if (idx !== -1) {
      const updated = db.digital_contracts[idx] as DigitalContract;
      updated.viewCount = (updated.viewCount ?? 0) + 1;
      if (!updated.viewedAt) updated.viewedAt = now;
      if (updated.status === 'sent') updated.status = 'viewed';
      writeDb(db);
    }
  }

  return NextResponse.json(contract);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const contract = getById<DigitalContract>('digital_contracts', id);
  if (!contract) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (contract.landlordId !== userId) return NextResponse.json({ error: 'Proibido' }, { status: 403 });
  if (!['draft', 'pending_review'].includes(contract.status)) {
    return NextResponse.json({ error: 'Contrato não pode ser editado neste estado' }, { status: 409 });
  }

  const body = await req.json();
  const result = UpdateDigitalContractSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }

  const now = new Date().toISOString();
  const db = readDb();
  const users = (db.users ?? []) as { id: string; name: string }[];
  const editor = users.find(u => u.id === userId);

  const historyEvent: ContractHistoryEvent = {
    id: crypto.randomUUID(),
    contractId: id,
    type: 'edited',
    description: 'Contrato editado',
    userId,
    userName: editor?.name ?? 'Proprietário',
    timestamp: now,
  };

  const updated = updateItem<DigitalContract>('digital_contracts', id, {
    ...result.data,
    updatedAt: now,
    version: contract.version + 1,
    history: [...contract.history, historyEvent],
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const contract = getById<DigitalContract>('digital_contracts', id);
  if (!contract) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (contract.landlordId !== userId) return NextResponse.json({ error: 'Proibido' }, { status: 403 });
  if (!['draft', 'cancelled', 'rejected'].includes(contract.status)) {
    return NextResponse.json({ error: 'Apenas contratos em rascunho ou cancelados podem ser deletados' }, { status: 409 });
  }

  deleteItem('digital_contracts', id);
  return new NextResponse(null, { status: 204 });
}
