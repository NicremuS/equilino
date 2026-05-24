import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { TenantSchema } from '@/lib/schemas';
import type { Tenant } from '@/types';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'tenant';
  tenantId: string;
  plan: string;
  createdAt: string;
}

export async function GET() {
  return NextResponse.json(getCollection<Tenant>('tenants'));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = TenantSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }

  const tenantId = crypto.randomUUID();
  const item: Tenant = { ...result.data, id: tenantId };
  createItem('tenants', item);

  if (result.data.email) {
    const users = getCollection<StoredUser>('users');
    const emailTaken = users.some(u => u.email === result.data.email);
    if (!emailTaken) {
      const newUser: StoredUser = {
        id: crypto.randomUUID(),
        name: result.data.name,
        email: result.data.email,
        password: '123456',
        role: 'tenant',
        tenantId,
        plan: 'starter',
        createdAt: new Date().toISOString(),
      };
      createItem('users', newUser);
    }
  }

  return NextResponse.json(item, { status: 201 });
}
