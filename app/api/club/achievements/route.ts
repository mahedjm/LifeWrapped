import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

const BADGE_NAMES: Record<string, string> = {
  explorer: 'Explorateur',
  loyal: 'Fidèle',
  melomaniac: 'Mélomane',
  ambassador: 'Ambassadeur'
};

const LEVEL_NAMES: Record<string, string[]> = {
  explorer: ['Curieux', 'Aventurier', 'Cartographe', 'Pionnier'],
  loyal: ['Régulier', 'Passionné', 'Dévoué', 'Inséparable'],
  melomaniac: ['Auditeur', 'Fan', 'Expert', 'Maestro'],
  ambassador: ['Ami', 'Populaire', 'Influenceur', 'Légende']
};

export async function GET(request: NextRequest) {
  try {
    const session = (await cookies()).get('auth_session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Récupérer les derniers succès des amis (et les tiens)
    const achievementsRes = await db.query(`
      WITH club_members AS (
        SELECT $1::uuid as user_id
        UNION
        SELECT friend_id FROM friendships WHERE user_id = $1::uuid
        UNION
        SELECT user_id FROM friendships WHERE friend_id = $1::uuid
      )
      SELECT 
        ub.badge_id,
        ub.level,
        ub.unlocked_at,
        u.username,
        u.id as user_id
      FROM user_badges ub
      JOIN users u ON ub.user_id = u.id
      JOIN club_members cm ON u.id = cm.user_id
      ORDER BY ub.unlocked_at DESC
      LIMIT 3
    `, [session]);

    const achievements = achievementsRes.rows.map(row => ({
      ...row,
      badgeName: BADGE_NAMES[row.badge_id] || row.badge_id,
      levelName: LEVEL_NAMES[row.badge_id] ? LEVEL_NAMES[row.badge_id][row.level - 1] : `Niveau ${row.level}`,
      isMe: row.user_id === session
    }));

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('API Club Achievements Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
