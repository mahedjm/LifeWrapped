import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete('auth_session');
  cookieStore.delete('lastfm_username');
  
  return NextResponse.json({ success: true });
}
