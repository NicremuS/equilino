import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db.server';
import type { Plan } from '@/types';

export async function GET() {
  const plans = getCollection<Plan>('plans');
  return NextResponse.json(plans);
}
