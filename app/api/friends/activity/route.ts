import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { getRecentTracks } from '@/lib/lastfm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = (await cookies()).get('auth_session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Récupérer les amis
    const friendsRes = await db.query(`
      SELECT u.id, u.username 
      FROM users u
      JOIN friendships f ON u.id = f.friend_id
      WHERE f.user_id = $1
    `, [session]);

    const friends = friendsRes.rows;

    if (friends.length === 0) {
      return NextResponse.json({ activity: [] });
    }

    // 2. Calculer le début de la semaine (Lundi 00:00)
    const nowObj = new Date();
    const dayOfWeek = nowObj.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(nowObj);
    monday.setDate(nowObj.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const mondayUTS = Math.floor(monday.getTime() / 1000);

    const sessionUsername = (await cookies()).get('lastfm_username')?.value;

    // 3. Récupérer l'activité détaillée pour chaque participant
    const participants = [
      { id: session, username: sessionUsername },
      ...friends
    ];

    const results = await Promise.all(participants.map(async (person) => {
      // a. Now Playing (Live)
      let nowPlaying = null;
      try {
        const tracks = await getRecentTracks(1, person.username);
        nowPlaying = tracks.length > 0 && tracks[0].nowPlaying ? tracks[0] : null;
      } catch (e) {}

      // b. Temps total et Top Artistes de la semaine
      const stats = await db.query(`
        SELECT 
          SUM(duration_ms) as total_ms,
          ARRAY_AGG(DISTINCT artist_name) as artists
        FROM (
          SELECT artist_name, SUM(duration_ms) as duration_ms
          FROM ecoutes 
          WHERE user_id = $1 AND played_at_uts >= $2
          GROUP BY artist_name
          ORDER BY duration_ms DESC
          LIMIT 10
        ) t
      `, [person.id, mondayUTS]);

      return {
        id: person.id,
        username: person.username,
        isMe: person.id === session,
        nowPlaying,
        weeklyTotalMs: Number(stats.rows[0]?.total_ms || 0),
        topArtists: stats.rows[0]?.artists || []
      };
    }));

    // 4. Calculer les comparaisons par rapport à MOI
    const me = results.find(r => r.isMe);
    const activity = results.map(person => {
      if (person.isMe) return person;

      // Artistes en commun
      const commonArtists = person.topArtists.filter((a: string) => me?.topArtists.includes(a));
      
      // Différence de temps
      const diffMs = me ? me.weeklyTotalMs - person.weeklyTotalMs : 0;

      return {
        ...person,
        commonArtists,
        timeDiffMs: diffMs // Positif si j'ai écouté plus, négatif si l'ami a écouté plus
      };
    });

    // Trier par temps d'écoute
    activity.sort((a, b) => b.weeklyTotalMs - a.weeklyTotalMs);

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('API Friends Activity Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
