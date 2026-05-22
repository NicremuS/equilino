import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { TenantSchema } from '@/lib/schemas';
import type { Tenant } from '@/types';

export async function GET() {
  return NextResponse.json(getCollection<Tenant>('tenants'));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = TenantSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }
  const item: Tenant = { ...result.data, id: crypto.randomUUID() };
  createItem('tenants', item);
  return NextResponse.json(item, { status: 201 });
}
