import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db.server';
import type { Property } from '@/types';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const properties = getCollection<Property>('properties');
  const property = properties.find(p => p.tenantId === tenantId);
  if (!property) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });

  return NextResponse.json(property);
}
