import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { getSession } from '@/lib/lastfm';
import { syncRecentlyPlayed } from '@/lib/sync';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=Mauvais jeton Last.fm', request.url));
  }

  try {
    // 1. Échanger le token contre une session officielle
    const session = await getSession(token);
    // session est { name: "LastFM_Username", key: "Session_Key" }

    // 2. Vérifier si l'invitation était valide (via cookie temporaire posé au login)
    const inviteCode = (await cookies()).get('pending_invite_code')?.value;
    if (inviteCode !== process.env.INVITE_CODE) {
      return NextResponse.redirect(new URL('/login?error=Accès refusé ou code expiré', request.url));
    }

    // 3. Enregistrer l'utilisateur dans PostgreSQL Neon
    const userRes = await db.query(
      `INSERT INTO users (username, invite_code, session_key) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (username) DO UPDATE 
       SET session_key = EXCLUDED.session_key, invite_code = EXCLUDED.invite_code
       RETURNING id`,
      [session.name, inviteCode, session.key]
    );

    const userId = userRes.rows[0].id;

    // Lancement de la synchronisation automatique en arrière-plan
    syncRecentlyPlayed(userId, session.name).catch(console.error);

    // 4. Définir les cookies de session officiels
    const cookieStore = await cookies();
    cookieStore.set('auth_session', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    });

    cookieStore.set('lastfm_username', session.name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    });

    // Nettoyer le cookie temporaire
    cookieStore.delete('pending_invite_code');

    // 5. Rediriger vers le Dashboard
    return NextResponse.redirect(new URL('/', request.url));

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent((error as Error).message)}`, request.url));
  }
}
