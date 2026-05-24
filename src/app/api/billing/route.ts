import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db.server';
import type { BillingPayment } from '@/types';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const payments = getCollection<BillingPayment>('billing_payments');
  const userPayments = payments
    .filter(p => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(userPayments);
}
