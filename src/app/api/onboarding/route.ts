import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb, getCollection } from '@/lib/db.server';
import { randomUUID } from 'crypto';
import type { OnboardingData, User } from '@/types';

interface StoredUser extends User { password?: string; }

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id');
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const data = getCollection<OnboardingData>('onboarding_data');
  const entry = data.find(d => d.userId === userId) ?? null;
  return NextResponse.json(entry);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Partial<OnboardingData> & { complete?: boolean };
  const db = readDb();

  const list = db.onboarding_data as OnboardingData[];
  const idx = list.findIndex(d => d.userId === userId);
  const now = new Date().toISOString();

  const patch: OnboardingData = {
    id: idx >= 0 ? list[idx].id : randomUUID(),
    userId,
    ...( idx >= 0 ? list[idx] : {}),
    ...(body as Partial<OnboardingData>),
    ...(body.complete ? { completedAt: now } : {}),
  };

  if (idx >= 0) {
    list[idx] = patch;
  } else {
    list.push(patch);
  }

  // Mark onboarding complete on user
  if (body.complete) {
    const users = db.users as StoredUser[];
    const uIdx = users.findIndex(u => u.id === userId);
    if (uIdx >= 0) {
      users[uIdx] = { ...users[uIdx], onboardingCompleted: true };
    }
  }

  writeDb(db);
  return NextResponse.json(patch);
}
