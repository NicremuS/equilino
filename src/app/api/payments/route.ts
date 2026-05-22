import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { PaymentSchema } from '@/lib/schemas';
import type { Payment } from '@/types';

export async function GET() {
  return NextResponse.json(getCollection<Payment>('payments'));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = PaymentSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }
  const item: Payment = { ...result.data, id: crypto.randomUUID() };
  createItem('payments', item);
  return NextResponse.json(item, { status: 201 });
}
