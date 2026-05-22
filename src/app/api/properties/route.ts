import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { PropertySchema } from '@/lib/schemas';
import type { Property } from '@/types';

export async function GET() {
  const items = getCollection<Property>('properties');
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = PropertySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }
  const item: Property = { ...result.data, id: crypto.randomUUID() };
  createItem('properties', item);
  return NextResponse.json(item, { status: 201 });
}
