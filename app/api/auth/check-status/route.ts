import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.get('auth_session')?.value;
  const isAuthorized = cookieStore.get('invite_authorized')?.value === 'true';

  // Si on est déjà autorisé par le passé mais pas encore connecté,
  // on pré-remplit le cookie temporaire pour le callback Last.fm
  if (isAuthorized && !hasSession) {
    cookieStore.set('pending_invite_code', process.env.INVITE_CODE || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 300
    });
  }

  return NextResponse.json({
    isAuthenticated: !!hasSession,
    isInviteAuthorized: isAuthorized
  });
}
