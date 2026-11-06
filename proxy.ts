import { NextRequest, NextResponse } from 'next/server';
export function proxy(request: NextRequest) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin');
    if (
      !origin ||
      origin !==
        (request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')) +
          '://' +
          request.headers.get('host')
    )
      return NextResponse.json({ error: 'invalid_origin' }, { status: 403 });
  }
  return NextResponse.next();
}
export const config = { matcher: '/api/:path*' };
