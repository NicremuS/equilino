import { NextRequest, NextResponse } from 'next/server';
import { deleteItem } from '@/lib/db.server';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = deleteItem('notices', id);
  if (!deleted) return NextResponse.json({ error: 'Aviso não encontrado' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
