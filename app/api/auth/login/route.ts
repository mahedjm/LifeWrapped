import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { inviteCode, lastfmUsername } = await req.json();

    if (!inviteCode || !lastfmUsername) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }

    if (inviteCode !== process.env.INVITE_CODE) {
      return NextResponse.json({ error: 'Code secret invalide' }, { status: 401 });
    }

    // Connect to PostgreSQL
    const usernameClean = lastfmUsername.trim().toLowerCase();
    
    // Find or create user
    const userRes = await db.query('SELECT id, username FROM users WHERE username = $1', [usernameClean]);
    
    let user;
    if (userRes.rows.length > 0) {
      user = userRes.rows[0];
    } else {
      const insertRes = await db.query(
        'INSERT INTO users (username, invite_code) VALUES ($1, $2) RETURNING id, username',
        [usernameClean, inviteCode]
      );
      user = insertRes.rows[0];
    }

    // Set HTTP-only cookie
    (await cookies()).set('auth_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    (await cookies()).set('lastfm_username', user.username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return NextResponse.json({ success: true, user });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
