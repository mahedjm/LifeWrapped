import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = (await cookies()).get('auth_session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
      return NextResponse.json({ users: [] });
    }

    // Rechercher les utilisateurs commençant par la requête (insensible à la casse)
    // On exclut l'utilisateur actuel de la recherche
    const users = await db.query(`
      SELECT username FROM users 
      WHERE username ILIKE $1 
      AND id != $2
      LIMIT 5
    `, [`${query}%`, session]);

    return NextResponse.json({ users: users.rows.map(r => r.username) });
  } catch (error) {
    console.error('API User Search Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
