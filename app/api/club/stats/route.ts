import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = (await cookies()).get('auth_session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Calculer le début de la semaine (7 derniers jours)
    const sevenDaysAgoUTS = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

    // Requête SQL pour trouver le Top 3 collectif (Toi + tes Amis)
    const topCollectiveRes = await db.query(`
      WITH club_members AS (
        SELECT $1::uuid as user_id
        UNION
        SELECT friend_id FROM friendships WHERE user_id = $1::uuid
        UNION
        SELECT user_id FROM friendships WHERE friend_id = $1::uuid
      )
      SELECT 
        e.artist_name as name,
        COUNT(*) as total_scrobbles,
        COUNT(DISTINCT e.user_id) as listener_count,
        a.image_url
      FROM ecoutes e
      JOIN club_members cm ON e.user_id = cm.user_id
      LEFT JOIN artistes a ON e.artist_name = a.name
      WHERE e.played_at_uts >= $2
      GROUP BY e.artist_name, a.image_url
      ORDER BY total_scrobbles DESC
      LIMIT 3
    `, [session, sevenDaysAgoUTS]);

    console.log(`Club Antenna for ${session}: found ${topCollectiveRes.rows.length} artists`);

    return NextResponse.json({ 
      topArtists: topCollectiveRes.rows.map(r => ({
        ...r,
        total_scrobbles: Number(r.total_scrobbles),
        listener_count: Number(r.listener_count)
      }))
    });
  } catch (error) {
    console.error('API Club Stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
