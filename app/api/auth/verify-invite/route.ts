import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { inviteCode } = await req.json();

    if (inviteCode === process.env.INVITE_CODE) {
      // Poser un cookie temporaire pour le callback (sécurité du flux OAuth)
      (await cookies()).set('pending_invite_code', inviteCode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 300 // 5 minutes suffisent pour faire l'aller-retour Last.fm
      });

      // Mémoriser que cet appareil est autorisé pour 1 an
      (await cookies()).set('invite_authorized', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Code secret invalide' }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
