import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = (await cookies()).get('auth_session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const friends = await db.query(`
      SELECT u.id, u.username 
      FROM users u
      JOIN friendships f ON u.id = f.friend_id
      WHERE f.user_id = $1 AND f.status = 'accepted'
    `, [session]);

    return NextResponse.json({ friends: friends.rows });
  } catch (error) {
    console.error('API Friends GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session')?.value;
    const sessionUsername = cookieStore.get('lastfm_username')?.value;

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username } = await request.json();
    if (!username) return NextResponse.json({ error: 'Nom d\'utilisateur requis' }, { status: 400 });

    // Trouver l'ami par son username
    const friendRes = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (friendRes.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé sur Écho. Invitez-le à rejoindre !' }, { status: 404 });
    }

    const friendId = friendRes.rows[0].id;
    if (friendId === session) {
      return NextResponse.json({ error: 'Vous ne pouvez pas vous ajouter vous-même' }, { status: 400 });
    }

    // Vérifier si une demande existe déjà
    const existing = await db.query('SELECT status FROM friendships WHERE user_id = $1 AND friend_id = $2', [session, friendId]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Une demande est déjà en cours ou vous êtes déjà amis' }, { status: 400 });
    }

    // Créer la demande (status 'pending')
    await db.query(`
      INSERT INTO friendships (user_id, friend_id, status) 
      VALUES ($1, $2, 'pending')
    `, [session, friendId]);

    // Envoyer une notification au destinataire
    await db.query(`
      INSERT INTO notifications (user_id, type, from_user_id, title, message)
      VALUES ($1, 'friend_request', $2, 'Nouvelle demande d''ami', $3)
    `, [friendId, session, `${sessionUsername} souhaite devenir votre ami sur Écho.`]);
    
    return NextResponse.json({ success: true, message: 'Demande envoyée !' });
  } catch (error) {
    console.error('API Friends POST Error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'ajout' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = (await cookies()).get('auth_session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { friendId } = await request.json();
    if (!friendId) return NextResponse.json({ error: 'ID de l\'ami requis' }, { status: 400 });

    // Suppression mutuelle : on retire le lien pour les deux utilisateurs
    await db.query('DELETE FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)', [session, friendId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Friends DELETE Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
