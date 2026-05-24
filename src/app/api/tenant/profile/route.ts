import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db.server';
import type { Tenant } from '@/types';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const tenants = getCollection<Tenant>('tenants');
  const tenant = tenants.find(t => t.id === tenantId);
  if (!tenant) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });

  return NextResponse.json(tenant);
}
