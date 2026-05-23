import { NextRequest, NextResponse } from 'next/server';
import { getCollection, createItem } from '@/lib/db.server';
import { NoticeSchema } from '@/lib/schemas';
import type { Notice } from '@/types';

export async function GET() {
  const notices = getCollection<Notice>('notices');
  const sorted = [...notices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = NoticeSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }

  const notice: Notice = {
    ...result.data,
    id: crypto.randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
  };

  createItem<Notice>('notices', notice);
  return NextResponse.json(notice, { status: 201 });
}
