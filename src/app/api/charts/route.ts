import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db.server';

export async function GET() {
  const db = readDb();
  return NextResponse.json({
    chartData: db.chartData,
    occupancyData: db.occupancyData,
    paymentStatusData: db.paymentStatusData,
  });
}
