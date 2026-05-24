import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth endpoints (login, logout, refresh, register) don't require a token —
  // only the change-password endpoint does (user must be logged in).
  if (pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/auth/change-password')) {
    return NextResponse.next();
  }

  // Cron endpoint: protected by optional CRON_SECRET header, not JWT
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next();
  }

  // Public plan listing — no auth needed
  if (pathname === '/api/plans') {
    return NextResponse.next();
  }

  // Subscription & billing endpoints require auth but NOT an active subscription
  // (user may be in the process of subscribing)
  // They still go through JWT verification below — just noted here for clarity.

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    const headers = new Headers(req.headers);
    headers.set('x-user-id', payload.sub ?? '');
    headers.set('x-user-role', (payload.role as string) ?? '');
    if (payload.tenantId) {
      headers.set('x-tenant-id', payload.tenantId as string);
    }
    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
