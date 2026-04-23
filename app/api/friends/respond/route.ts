import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = (await cookies()).get('auth_session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { notificationId, action } = await request.json();

    // 1. Trouver la notification et le demandeur
    const notifRes = await db.query(`
      SELECT from_user_id FROM notifications 
      WHERE id = $1 AND user_id = $2 AND type = 'friend_request'
    `, [notificationId, session]);

    if (notifRes.rows.length === 0) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    const fromUserId = notifRes.rows[0].from_user_id;

    if (action === 'accept') {
      // Mettre à jour la relation existante (de A vers B) en 'accepted'
      await db.query(`
        UPDATE friendships SET status = 'accepted' 
        WHERE user_id = $1 AND friend_id = $2
      `, [fromUserId, session]);

      // Créer la relation réciproque (de B vers A) en 'accepted'
      await db.query(`
        INSERT INTO friendships (user_id, friend_id, status)
        VALUES ($1, $2, 'accepted')
        ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'
      `, [session, fromUserId]);
    } else {
      // Refuser : supprimer la relation pending
      await db.query(`
        DELETE FROM friendships 
        WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
      `, [fromUserId, session]);
    }

    // Supprimer la notification une fois traitée
    await db.query('DELETE FROM notifications WHERE id = $1', [notificationId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Friend Respond Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
