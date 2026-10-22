import { NextResponse } from 'next/server';
import { STAFF_COOKIE, cookieOptions } from '@/lib/admin/config';

export async function POST() {
  const out = new NextResponse(null, { status: 204 });
  out.cookies.set(STAFF_COOKIE, '', cookieOptions(0));
  return out;
}
