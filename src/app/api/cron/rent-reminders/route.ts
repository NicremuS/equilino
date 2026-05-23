import { NextRequest, NextResponse } from 'next/server';
import { checkAndCreateRentReminders } from '@/lib/rentReminders.server';

// Called by Vercel Cron (vercel.json) at 08:00 UTC daily.
// Also usable for manual trigger during development.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const created = checkAndCreateRentReminders();
  return NextResponse.json({ ok: true, created });
}
