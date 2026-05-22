import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { InspectionSchema } from '@/lib/schemas';
import type { Inspection } from '@/types';

export async function GET() {
  return NextResponse.json(getCollection<Inspection>('inspections'));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = InspectionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }
  const item: Inspection = { ...result.data, id: crypto.randomUUID() };
  createItem('inspections', item);
  return NextResponse.json(item, { status: 201 });
}
