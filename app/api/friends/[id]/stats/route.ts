import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await cookies()).get('auth_session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Vérifier si ils sont amis (sécurité)
    const friendship = await db.query(
      'SELECT 1 FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = \'accepted\'',
      [session, id]
    );

    // On autorise aussi de voir son propre profil via cette API si besoin
    if (friendship.rows.length === 0 && session !== id) {
      return NextResponse.json({ error: 'Vous n\'êtes pas amis avec cet utilisateur' }, { status: 403 });
    }

    // Début du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startUTS = Math.floor(startOfMonth.getTime() / 1000);

    // 1. Top 5 Artistes du mois
    const topArtists = await db.query(`
      SELECT artist, SUM(duration_ms) as total_ms, MAX(image_url) as image_url
      FROM ecoutes
      WHERE user_id = $1 AND played_at_uts >= $2
      GROUP BY artist
      ORDER BY total_ms DESC
      LIMIT 5
    `, [id, startUTS]);

    // 2. Top 5 Morceaux du mois
    const topTracks = await db.query(`
      SELECT title, artist, COUNT(*) as play_count, MAX(image_url) as image_url
      FROM ecoutes
      WHERE user_id = $1 AND played_at_uts >= $2
      GROUP BY title, artist
      ORDER BY play_count DESC
      LIMIT 5
    `, [id, startUTS]);

    // 3. Infos de base de l'utilisateur
    const user = await db.query('SELECT username FROM users WHERE id = $1', [id]);

    return NextResponse.json({
      username: user.rows[0].username,
      topArtists: topArtists.rows,
      topTracks: topTracks.rows
    });
  } catch (error) {
    console.error('API Friend Stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
