import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { syncRecentlyPlayed } from '@/lib/sync';

/**
 * Route CRON pour la synchronisation globale
 * Cette route est appelée par Vercel Cron pour mettre à jour tous les utilisateurs.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Sécurité simple pour éviter que n'importe qui déclenche la sync
  if (secret !== process.env.INVITE_CODE) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
  }

  try {
    console.log('--- GLOBAL CRON SYNC START ---');
    
    // 1. Récupérer tous les utilisateurs
    const usersRes = await db.query('SELECT id, username FROM users');
    const users = usersRes.rows;

    const results = [];

    // 2. Lancer la synchronisation pour chacun
    for (const user of users) {
      console.log(`Cron: Syncing user ${user.username}...`);
      const res = await syncRecentlyPlayed(user.id, user.username);
      results.push({ username: user.username, ...res });
    }

    console.log('--- GLOBAL CRON SYNC END ---');
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results
    });

  } catch (error) {
    console.error('Global Cron Sync failed:', error);
    return NextResponse.json({ error: 'Global Cron Sync failed', details: (error as Error).message }, { status: 500 });
  }
}
