import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { getRecentTracks } from '@/lib/lastfm';

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

    const BADGE_CONFIG = {
      explorer: {
        id: 'explorer', name: 'Explorateur', description: 'Découvrez de nouveaux artistes pour élargir votre horizon.', icon: 'Compass',
        levels: [ { level: 1, name: 'Curieux', threshold: 20 }, { level: 2, name: 'Aventurier', threshold: 50 }, { level: 3, name: 'Cartographe', threshold: 100 }, { level: 4, name: 'Pionnier', threshold: 250 } ]
      },
      loyal: {
        id: 'loyal', name: 'Fidèle', description: 'Écoutez de la musique plusieurs jours d\'affilée.', icon: 'Heart',
        levels: [ { level: 1, name: 'Régulier', threshold: 3 }, { level: 2, name: 'Passionné', threshold: 7 }, { level: 3, name: 'Dévoué', threshold: 15 }, { level: 4, name: 'Inséparable', threshold: 30 } ]
      },
      melomaniac: {
        id: 'melomaniac', name: 'Mélomane', description: 'Cumulez un maximum d\'heures d\'écoute au total.', icon: 'Headphones',
        levels: [ { level: 1, name: 'Auditeur', threshold: 50 }, { level: 2, name: 'Fan', threshold: 250 }, { level: 3, name: 'Expert', threshold: 1000 }, { level: 4, name: 'Maestro', threshold: 2500 } ]
      },
      ambassador: {
        id: 'ambassador', name: 'Ambassadeur', description: 'Invitez et ajoutez des amis sur votre profil Écho.', icon: 'Users',
        levels: [ { level: 1, name: 'Ami', threshold: 1 }, { level: 2, name: 'Populaire', threshold: 5 }, { level: 3, name: 'Influenceur', threshold: 15 }, { level: 4, name: 'Légende', threshold: 50 } ]
      },
      nightowl: {
        id: 'nightowl', name: 'Oiseau de Nuit', description: 'Écoutez de la musique entre 21h et 3h du matin.', icon: 'Moon',
        levels: [ { level: 1, name: 'Couche-tard', threshold: 5 }, { level: 2, name: 'Noctambule', threshold: 25 }, { level: 3, name: 'Vampire', threshold: 100 }, { level: 4, name: 'Maître de la nuit', threshold: 500 } ]
      },
      marathonien: {
        id: 'marathonien', name: 'Marathonien', description: 'Temps d\'écoute cumulé sans pause de plus de 15 min.', icon: 'Timer',
        levels: [ { level: 1, name: 'Joggeur', threshold: 1 }, { level: 2, name: 'Coureur', threshold: 3 }, { level: 3, name: 'Athlète', threshold: 6 }, { level: 4, name: 'Olympien', threshold: 10 } ]
      }
    };

    const loyalQuery = `
      WITH daily_listening AS (
        SELECT DISTINCT date_trunc('day', to_timestamp(played_at_uts) AT TIME ZONE 'Europe/Paris') as day
        FROM ecoutes
        WHERE user_id = $1
      ),
      streaks AS (
        SELECT day, day - (interval '1 day' * row_number() OVER (ORDER BY day)) as grp
        FROM daily_listening
      )
      SELECT COUNT(*) as streak_length
      FROM streaks
      GROUP BY grp
      ORDER BY streak_length DESC
      LIMIT 1
    `;

    const marathonQuery = `
      WITH track_ends AS (
        SELECT 
          played_at_uts,
          played_at_uts + (duration_ms / 1000) as ended_at_uts,
          LAG(played_at_uts + (duration_ms / 1000)) OVER (ORDER BY played_at_uts) as prev_ended_at_uts
        FROM ecoutes
        WHERE user_id = $1
      ),
      session_starts AS (
        SELECT 
          played_at_uts,
          ended_at_uts,
          CASE 
            WHEN prev_ended_at_uts IS NULL OR (played_at_uts - prev_ended_at_uts) > 900 THEN 1 
            ELSE 0 
          END as is_new_session
        FROM track_ends
      ),
      session_ids AS (
        SELECT 
          played_at_uts,
          ended_at_uts,
          SUM(is_new_session) OVER (ORDER BY played_at_uts) as session_id
        FROM session_starts
      ),
      session_durations AS (
        SELECT 
          session_id,
          MAX(ended_at_uts) - MIN(played_at_uts) as total_duration_sec
        FROM session_ids
        GROUP BY session_id
      )
      SELECT COALESCE(MAX(total_duration_sec), 0) / 3600.0 as max_session_hours
      FROM session_durations
    `;

    // Exécution de toutes les requêtes en parallèle (Top artistes, Top morceaux, User Info, Stats Badges)
    const [topArtists, topTracks, user, explorerRes, loyalRes, melomaniacRes, ambassadorRes, nightowlRes, marathonRes] = await Promise.all([
      db.query(`SELECT artist_name as artist, SUM(duration_ms) as total_ms, MAX(image_url) as image_url FROM ecoutes WHERE user_id = $1 AND played_at_uts >= $2 GROUP BY artist_name ORDER BY total_ms DESC LIMIT 5`, [id, startUTS]),
      db.query(`SELECT track_name as title, artist_name as artist, COUNT(*) as play_count, MAX(image_url) as image_url FROM ecoutes WHERE user_id = $1 AND played_at_uts >= $2 GROUP BY track_name, artist_name ORDER BY play_count DESC LIMIT 5`, [id, startUTS]),
      db.query('SELECT username FROM users WHERE id = $1', [id]),
      db.query('SELECT COUNT(DISTINCT artist_name) FROM ecoutes WHERE user_id = $1', [id]),
      db.query(loyalQuery, [id]),
      db.query('SELECT SUM(duration_ms) FROM ecoutes WHERE user_id = $1', [id]),
      db.query('SELECT COUNT(*) FROM friendships WHERE user_id = $1 OR friend_id = $1', [id]),
      db.query("SELECT COUNT(*) FROM ecoutes WHERE user_id = $1 AND (EXTRACT(HOUR FROM to_timestamp(played_at_uts) AT TIME ZONE 'Europe/Paris') >= 21 OR EXTRACT(HOUR FROM to_timestamp(played_at_uts) AT TIME ZONE 'Europe/Paris') < 3)", [id]),
      db.query(marathonQuery, [id])
    ]);

    const username = user.rows[0]?.username;
    let nowPlaying = null;

    if (username) {
      try {
        const recentTracks = await getRecentTracks(1, username);
        if (recentTracks.length > 0 && recentTracks[0].nowPlaying) {
          nowPlaying = recentTracks[0];
        }
      } catch (e) {
        console.error('Error fetching friend now playing:', e);
      }
    }

    const counts: Record<string, number> = {
      explorer: Number(explorerRes.rows[0]?.count || 0),
      loyal: Number(loyalRes.rows[0]?.streak_length || 0),
      melomaniac: Number(melomaniacRes.rows[0]?.sum || 0) / (1000 * 60 * 60),
      ambassador: Number(ambassadorRes.rows[0]?.count || 0),
      nightowl: Number(nightowlRes.rows[0]?.count || 0),
      marathonien: Number(marathonRes.rows[0]?.max_session_hours || 0)
    };

    const badges = Object.values(BADGE_CONFIG).map(config => {
      const currentVal = counts[config.id];
      let currentLevelInfo = null;
      let nextLevelInfo = null;
      let level = 0;

      for (let i = 0; i < config.levels.length; i++) {
        if (currentVal >= config.levels[i].threshold) {
          level = config.levels[i].level;
          currentLevelInfo = config.levels[i];
        } else {
          nextLevelInfo = config.levels[i];
          break;
        }
      }

      const isMaxLevel = level === config.levels[config.levels.length - 1].level;
      const currentThreshold = currentLevelInfo ? currentLevelInfo.threshold : 0;
      const nextThreshold = nextLevelInfo ? nextLevelInfo.threshold : config.levels[config.levels.length - 1].threshold;
      const progress = isMaxLevel ? 100 : Math.min(100, Math.round(((currentVal - currentThreshold) / (nextThreshold - currentThreshold)) * 100));

      return {
        ...config, level, levelName: currentLevelInfo ? currentLevelInfo.name : null,
        isUnlocked: level > 0, currentVal: Math.floor(currentVal), nextThreshold, progress, isMaxLevel
      };
    });

    return NextResponse.json({
      username: user.rows[0].username,
      topArtists: topArtists.rows,
      topTracks: topTracks.rows,
      badges,
      nowPlaying
    });
  } catch (error) {
    console.error('API Friend Stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
