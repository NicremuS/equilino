import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { CreateTemplateSchema } from '@/lib/schemas';
import type { ContractTemplate } from '@/types';

export async function GET() {
  const templates = getCollection<ContractTemplate>('contract_templates')
    .sort((a, b) => b.usageCount - a.usageCount);
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const userRole = req.headers.get('x-user-role');
  if (userRole === 'tenant') return NextResponse.json({ error: 'Proibido' }, { status: 403 });

  const body = await req.json();
  const result = CreateTemplateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }

  const now = new Date().toISOString();
  const template: ContractTemplate = {
    ...result.data,
    id: crypto.randomUUID(),
    isBuiltIn: false,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  createItem<ContractTemplate>('contract_templates', template);
  return NextResponse.json(template, { status: 201 });
}
