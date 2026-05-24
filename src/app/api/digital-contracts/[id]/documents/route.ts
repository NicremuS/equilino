import { NextRequest, NextResponse } from 'next/server';
import { getById, readDb, writeDb } from '@/lib/db.server';
import type { DigitalContract, ContractDocument, ContractHistoryEvent } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const contract = getById<DigitalContract>('digital_contracts', id);
  if (!contract) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(contract.documents ?? []);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const userId = req.headers.get('x-user-id');
  const tenantId = req.headers.get('x-tenant-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const contract = getById<DigitalContract>('digital_contracts', id);
  if (!contract) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const body = await req.json() as {
    name: string;
    docType: ContractDocument['docType'];
    fileData: string;
    mimeType: string;
    sizeBytes: number;
  };

  if (!body.fileData || !body.name) {
    return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 422 });
  }

  const now = new Date().toISOString();
  const uploaderRole = tenantId ? 'tenant' : 'landlord';

  const doc: ContractDocument = {
    id: crypto.randomUUID(),
    contractId: id,
    name: body.name,
    docType: body.docType ?? 'other',
    uploadedBy: userId,
    uploadedByRole: uploaderRole,
    uploadedAt: now,
    fileData: body.fileData,
    mimeType: body.mimeType ?? 'application/octet-stream',
    sizeBytes: body.sizeBytes ?? 0,
  };

  const db = readDb();
  const users = (db.users ?? []) as { id: string; name: string }[];
  const uploader = users.find(u => u.id === userId);

  const historyEvent: ContractHistoryEvent = {
    id: crypto.randomUUID(),
    contractId: id,
    type: 'document_uploaded',
    description: `Documento "${body.name}" enviado por ${uploader?.name ?? 'Usuário'}`,
    userId,
    userName: uploader?.name ?? 'Usuário',
    timestamp: now,
  };

  const idx = (db.digital_contracts as DigitalContract[]).findIndex(c => c.id === id);
  if (idx !== -1) {
    const c = db.digital_contracts[idx] as DigitalContract;
    c.documents = [...(c.documents ?? []), doc];
    c.history = [...(c.history ?? []), historyEvent];
    c.updatedAt = now;
  }

  writeDb(db);
  return NextResponse.json(doc, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const docId = searchParams.get('docId');
  if (!docId) return NextResponse.json({ error: 'docId obrigatório' }, { status: 422 });

  const contract = getById<DigitalContract>('digital_contracts', id);
  if (!contract) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const db = readDb();
  const idx = (db.digital_contracts as DigitalContract[]).findIndex(c => c.id === id);
  if (idx !== -1) {
    const c = db.digital_contracts[idx] as DigitalContract;
    c.documents = (c.documents ?? []).filter(d => d.id !== docId);
    c.updatedAt = new Date().toISOString();
  }
  writeDb(db);

  return new NextResponse(null, { status: 204 });
}
