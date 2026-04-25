import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

const BADGE_CONFIG = {
  explorer: {
    id: 'explorer',
    name: 'Explorateur',
    description: 'Découvrez de nouveaux artistes pour élargir votre horizon.',
    icon: 'Compass',
    levels: [
      { level: 1, name: 'Curieux', threshold: 20 },
      { level: 2, name: 'Aventurier', threshold: 50 },
      { level: 3, name: 'Cartographe', threshold: 100 },
      { level: 4, name: 'Pionnier', threshold: 250 }
    ]
  },
  loyal: {
    id: 'loyal',
    name: 'Fidèle',
    description: 'Écoutez de la musique plusieurs jours d\'affilée.',
    icon: 'Heart',
    levels: [
      { level: 1, name: 'Régulier', threshold: 3 },
      { level: 2, name: 'Passionné', threshold: 7 },
      { level: 3, name: 'Dévoué', threshold: 15 },
      { level: 4, name: 'Inséparable', threshold: 30 }
    ]
  },
  melomaniac: {
    id: 'melomaniac',
    name: 'Mélomane',
    description: 'Cumulez un maximum d\'heures d\'écoute au total.',
    icon: 'Headphones',
    levels: [
      { level: 1, name: 'Auditeur', threshold: 50 },
      { level: 2, name: 'Fan', threshold: 250 },
      { level: 3, name: 'Expert', threshold: 1000 },
      { level: 4, name: 'Maestro', threshold: 2500 }
    ]
  },
  ambassador: {
    id: 'ambassador',
    name: 'Ambassadeur',
    description: 'Invitez et ajoutez des amis sur votre profil Écho.',
    icon: 'Users',
    levels: [
      { level: 1, name: 'Ami', threshold: 1 },
      { level: 2, name: 'Populaire', threshold: 5 },
      { level: 3, name: 'Influenceur', threshold: 15 },
      { level: 4, name: 'Légende', threshold: 50 }
    ]
  }
};

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('auth_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionCookie;

    // 1. Récupération des statistiques brutes pour les badges en parallèle
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

    const [explorerRes, loyalRes, melomaniacRes, ambassadorRes] = await Promise.all([
      db.query('SELECT COUNT(DISTINCT artist_name) FROM ecoutes WHERE user_id = $1', [userId]),
      db.query(loyalQuery, [userId]),
      db.query('SELECT SUM(duration_ms) FROM ecoutes WHERE user_id = $1', [userId]),
      db.query('SELECT COUNT(*) FROM friendships WHERE user_id = $1 OR friend_id = $1', [userId])
    ]);

    const counts: Record<string, number> = {
      explorer: Number(explorerRes.rows[0]?.count || 0),
      loyal: Number(loyalRes.rows[0]?.streak_length || 0),
      melomaniac: Number(melomaniacRes.rows[0]?.sum || 0) / (1000 * 60 * 60),
      ambassador: Number(ambassadorRes.rows[0]?.count || 0)
    };

    // 2. Calcul des badges
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

      // Enregistrer l'exploit dans la base de données s'il est débloqué
      if (level > 0) {
        db.query(`
          INSERT INTO user_badges (user_id, badge_id, level)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, badge_id, level) DO NOTHING
        `, [userId, config.id, level]).catch(e => console.error('Error recording badge:', e));
      }

      return {
        ...config,
        level,
        levelName: currentLevelInfo ? currentLevelInfo.name : null,
        isUnlocked: level > 0,
        currentVal: Math.round(currentVal),
        nextThreshold,
        progress,
        isMaxLevel
      };
    });

    return NextResponse.json({ badges });
  } catch (error) {
    console.error('API Badges Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
