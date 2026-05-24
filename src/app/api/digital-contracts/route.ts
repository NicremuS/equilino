import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem, readDb, writeDb } from '@/lib/db.server';
import { CreateDigitalContractSchema } from '@/lib/schemas';
import type { DigitalContract, ContractHistoryEvent, Property, Tenant, Notification } from '@/types';

export async function GET(req: NextRequest) {
  const landlordId = req.headers.get('x-user-id');
  if (!landlordId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let contracts = getCollection<DigitalContract>('digital_contracts')
    .filter(c => c.landlordId === landlordId);

  if (status) {
    contracts = contracts.filter(c => c.status === status);
  }

  contracts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return NextResponse.json(contracts);
}

export async function POST(req: NextRequest) {
  const landlordId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');
  if (!landlordId || userRole === 'tenant') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const result = CreateDigitalContractSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }

  const data = result.data;
  const now = new Date().toISOString();

  // Enrich with property/tenant names
  const properties = getCollection<Property>('properties');
  const tenants = getCollection<Tenant>('tenants');
  const property = properties.find(p => p.id === data.propertyId);
  const tenant = tenants.find(t => t.id === data.tenantId);

  const db = readDb();
  const users = (db.users ?? []) as { id: string; name: string; email: string }[];
  const landlord = users.find(u => u.id === landlordId);

  const historyEvent: ContractHistoryEvent = {
    id: crypto.randomUUID(),
    contractId: '',
    type: 'created',
    description: 'Contrato criado',
    userId: landlordId,
    userName: landlord?.name ?? 'Proprietário',
    timestamp: now,
  };

  const contract: DigitalContract = {
    ...data,
    id: crypto.randomUUID(),
    status: 'draft',
    landlordId,
    landlordName: landlord?.name,
    landlordEmail: landlord?.email,
    tenantName: tenant?.name,
    tenantEmail: tenant?.email,
    propertyName: property?.name,
    propertyAddress: property ? `${property.address}, ${property.city}` : undefined,
    signatures: [],
    documents: [],
    history: [{ ...historyEvent, contractId: '' }],
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    version: 1,
  };

  contract.history[0].contractId = contract.id;
  createItem<DigitalContract>('digital_contracts', contract);

  return NextResponse.json(contract, { status: 201 });
}
