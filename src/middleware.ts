import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

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
