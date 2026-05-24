import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb, getCollection } from '@/lib/db.server';
import { randomUUID } from 'crypto';
import type { Subscription, PlanId, BillingCycle, User } from '@/types';

interface StoredUser extends User { password?: string; }

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const subs = getCollection<Subscription>('subscriptions');
  const sub = subs.find(s => s.userId === userId) ?? null;
  return NextResponse.json(sub);
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    planId?: PlanId;
    billingCycle?: BillingCycle;
    status?: string;
  };

  const { planId = 'basic', billingCycle = 'monthly', status = 'pending' } = body;

  const db = readDb();
  const subs = db.subscriptions as Subscription[];
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

  const existing = subs.findIndex(s => s.userId === userId);
  const sub: Subscription = {
    id: existing >= 0 ? subs[existing].id : randomUUID(),
    userId,
    planId,
    status: status as Subscription['status'],
    billingCycle,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    createdAt: existing >= 0 ? subs[existing].createdAt : now.toISOString(),
    updatedAt: now.toISOString(),
  };

  if (existing >= 0) {
    subs[existing] = sub;
  } else {
    subs.push(sub);
  }

  // Sync user plan + status
  const users = db.users as StoredUser[];
  const uIdx = users.findIndex(u => u.id === userId);
  if (uIdx >= 0) {
    users[uIdx] = {
      ...users[uIdx],
      plan: planId,
      subscriptionStatus: sub.status,
    };
  }

  writeDb(db);
  return NextResponse.json(sub, { status: 201 });
}
