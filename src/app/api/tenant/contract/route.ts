import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db.server';
import type { Contract } from '@/types';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const contracts = getCollection<Contract>('contracts');
  const contract = contracts.find(c => c.tenantId === tenantId && c.status !== 'terminated');
  if (!contract) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });

  return NextResponse.json(contract);
}
