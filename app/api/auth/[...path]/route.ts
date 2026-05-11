import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = process.env.BACKEND_URL!;

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const target = `${BACKEND}/auth/${path.join('/')}`;

  const cookieStore = await cookies();

  const upstream = await fetch(target, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieStore.toString(),
    },
    body: req.method !== 'GET' ? await req.text() : undefined,
  });

  const body = await upstream.text();
  const res = new NextResponse(body, { status: upstream.status });
  res.headers.set('Content-Type', 'application/json');

  for (const c of upstream.headers.getSetCookie()) {
    res.headers.append('Set-Cookie', c.replace(/;\s*Domain=[^;]*/i, ''));
  }

  return res;
}

export { handler as GET, handler as POST };
