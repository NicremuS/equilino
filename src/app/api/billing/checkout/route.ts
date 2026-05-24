import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb, getCollection } from '@/lib/db.server';
import { randomUUID } from 'crypto';
import type { BillingPayment, Subscription, PlanId, BillingCycle, User, Plan } from '@/types';

interface StoredUser extends User { password?: string; }

/**
 * Mock payment processor — simulates a real payment gateway.
 * In production, replace with Stripe or Mercado Pago integration.
 */
function mockProcessPayment(method: 'card' | 'pix', last4?: string): { ok: boolean; error?: string } {
  // Simulate payment failures for test card 4000 0000 0000 0002
  if (method === 'card' && last4 === '0002') {
    return { ok: false, error: 'Cartão recusado pela operadora' };
  }
  return { ok: true };
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    planId?: PlanId;
    billingCycle?: BillingCycle;
    paymentMethod?: 'card' | 'pix';
    cardNumber?: string;
    cardName?: string;
    cardExpiry?: string;
    cardCvv?: string;
  };

  const {
    planId = 'pro',
    billingCycle = 'monthly',
    paymentMethod = 'pix',
    cardNumber,
  } = body;

  const plans = getCollection<Plan>('plans');
  const plan = plans.find(p => p.id === planId);
  if (!plan) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });

  const last4 = cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : undefined;
  const result = mockProcessPayment(paymentMethod, last4);

  const db = readDb();
  const now = new Date();

  const amount = billingCycle === 'yearly'
    ? plan.yearlyPrice * 12
    : plan.monthlyPrice;

  const payment: BillingPayment = {
    id: randomUUID(),
    userId,
    subscriptionId: '',   // filled below
    amount,
    status: result.ok ? 'succeeded' : 'failed',
    paymentMethod,
    planName: plan.name,
    description: `${plan.name} — ${billingCycle === 'yearly' ? 'Anual' : 'Mensal'}`,
    createdAt: now.toISOString(),
    ...(last4 ? { last4 } : {}),
  };

  if (!result.ok) {
    (db.billing_payments as BillingPayment[]).push(payment);
    writeDb(db);
    return NextResponse.json({ ok: false, error: result.error }, { status: 402 });
  }

  // Activate subscription
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

  const subs = db.subscriptions as Subscription[];
  const existing = subs.findIndex(s => s.userId === userId);
  const sub: Subscription = {
    id: existing >= 0 ? subs[existing].id : randomUUID(),
    userId,
    planId,
    status: 'active',
    billingCycle,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    createdAt: existing >= 0 ? subs[existing].createdAt : now.toISOString(),
    updatedAt: now.toISOString(),
  };

  if (existing >= 0) subs[existing] = sub;
  else subs.push(sub);

  payment.subscriptionId = sub.id;
  (db.billing_payments as BillingPayment[]).push(payment);

  // Sync user
  const users = db.users as StoredUser[];
  const uIdx = users.findIndex(u => u.id === userId);
  if (uIdx >= 0) {
    users[uIdx] = {
      ...users[uIdx],
      plan: planId,
      subscriptionStatus: 'active',
      onboardingCompleted: true,
    };
  }

  writeDb(db);

  // Return updated user for client to refresh session
  const { password: _pw, ...safeUser } = users[uIdx] ?? {};

  return NextResponse.json({ ok: true, subscription: sub, payment, user: safeUser });
}
