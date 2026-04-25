import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('auth_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionCookie;
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 3600);

    // 1. Top 50 artistes de l'utilisateur courant (7 derniers jours)
    const userTopArtistsRes = await db.query(`
      SELECT artist_name, SUM(duration_ms) as total_ms
      FROM ecoutes
      WHERE user_id = $1 AND played_at_uts >= $2
      GROUP BY artist_name
      ORDER BY total_ms DESC
      LIMIT 50
    `, [userId, sevenDaysAgo]);

    const userArtists = userTopArtistsRes.rows;
    const userArtistNames = new Set(userArtists.map(a => a.artist_name));

    if (userArtistNames.size === 0) {
      return NextResponse.json({ message: 'Pas assez de données pour un Vibe Match' }, { status: 200 });
    }

    // 2. Récupérer la liste des amis
    const friendsRes = await db.query(`
      SELECT 
        u.id, u.username
      FROM users u
      JOIN friendships f ON (f.friend_id = u.id AND f.user_id = $1) OR (f.user_id = u.id AND f.friend_id = $1)
    `, [userId]);

    const friends = friendsRes.rows;
    if (friends.length === 0) {
      return NextResponse.json({ message: 'Ajoutez des amis pour voir votre Vibe Match' }, { status: 200 });
    }

    let bestMatch = null;
    let maxScore = -1;

    // 3. Calculer le score pour chaque ami
    for (const friend of friends) {
      const friendTopArtistsRes = await db.query(`
        SELECT 
          artist_name, 
          SUM(duration_ms) as total_ms,
          (SELECT image_url FROM artistes WHERE name = artist_name LIMIT 1) as image_url
        FROM ecoutes
        WHERE user_id = $1 AND played_at_uts >= $2
        GROUP BY artist_name
        ORDER BY total_ms DESC
        LIMIT 50
      `, [friend.id, sevenDaysAgo]);

      const friendArtists = friendTopArtistsRes.rows;
      const friendArtistNames = new Set(friendArtists.map(a => a.artist_name));

      if (friendArtistNames.size === 0) continue;

      // Calcul de l'indice de Jaccard
      const intersection = new Set([...userArtistNames].filter(x => friendArtistNames.has(x)));
      const union = new Set([...userArtistNames, ...friendArtistNames]);
      
      const score = Math.round((intersection.size / union.size) * 100);

      // Trouver l'artiste commun le plus fort
      let topCommonArtist = null;
      let maxCombinedMs = -1;

      intersection.forEach(artistName => {
        const userMs = Number(userArtists.find(a => a.artist_name === artistName)?.total_ms || 0);
        const friendItem = friendArtists.find(a => a.artist_name === artistName);
        const friendMs = Number(friendItem?.total_ms || 0);
        const combinedMs = userMs + friendMs;

        if (combinedMs > maxCombinedMs) {
          maxCombinedMs = combinedMs;
          topCommonArtist = {
            name: artistName,
            image_url: friendItem?.image_url || null
          };
        }
      });

      if (score > maxScore) {
        maxScore = score;
        bestMatch = {
          friend: friend.username,
          score: score,
          commonArtist: topCommonArtist
        };
      }
    }

    if (!bestMatch || maxScore === 0) {
      return NextResponse.json({ message: 'Pas de match musical cette semaine' }, { status: 200 });
    }

    return NextResponse.json(bestMatch);

  } catch (error) {
    console.error('Vibe Match Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
