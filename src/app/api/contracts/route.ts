import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { ContractSchema } from '@/lib/schemas';
import type { Contract } from '@/types';

export async function GET() {
  return NextResponse.json(getCollection<Contract>('contracts'));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = ContractSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }
  const item: Contract = { ...result.data, id: crypto.randomUUID() };
  createItem('contracts', item);
  return NextResponse.json(item, { status: 201 });
}
