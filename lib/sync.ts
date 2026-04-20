import db from './db';
import { getRecentTracks, getArtistTags, getTrackInfo, getArtistInfo } from './lastfm';

/**
 * Moteur de synchronisation Turbo
 * Optimisé pour la performance : parallélisation des appels API et réduction des requêtes DB.
 */
export async function syncRecentlyPlayed(userId: string, username: string) {
  console.log(`--- Turbo Syncing Écho Tracks for ${username} ---`);
  const startTime = Date.now();
  
  try {
    // 0. Trouver la date de la dernière écoute enregistrée pour ce membre
    const lastEntryRes = await db.query('SELECT MAX(played_at_uts) as last_uts FROM ecoutes WHERE user_id = $1', [userId]);
    const lastUts = lastEntryRes.rows[0]?.last_uts;

    // 1. Récupération des musiques récentes
    // Si c'est le premier import (lastUts null), on prend 200 sons. Sinon, on prend tout ce qui est nouveau depuis lastUts.
    const limit = lastUts ? 50 : 200; 
    const tracks = await getRecentTracks(limit, username, lastUts ? Number(lastUts) : undefined);
    
    if (!tracks || tracks.length === 0) {
      console.log(`Nothing new for ${username}.`);
      return { success: true, count: 0 };
    }

    // --- PHASE 1 : MÉTADONNÉES ARTISTES ---
    const uniqueArtists = Array.from(new Set(tracks.map(t => t.artist)));
    
    // Parallélisation du traitement des artistes par lots de 5
    await Promise.all(
      uniqueArtists.map(async (artistName) => {
        const artistRes = await db.query('SELECT image_url, genres FROM artistes WHERE name = $1', [artistName]);
        const artistRow = artistRes.rows[0];
        
        if (!artistRow) {
          // Nouvel artiste : Fetch complet
          const [info, tags] = await Promise.all([
            getArtistInfo(artistName),
            getArtistTags(artistName)
          ]);
          
          let artistImage = ''; 
          if (info && info.artist && info.artist.image) {
            const img = info.artist.image.find((i: any) => i.size === 'extralarge') || info.artist.image[info.artist.image.length - 1];
            artistImage = img?.['#text'] || '';
            if (artistImage.includes('2a96cbd8b46e442fc41c2b86b821562f')) artistImage = '';
          }
          
          await db.query(
            'INSERT INTO artistes (name, image_url, genres) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
            [artistName, artistImage, JSON.stringify(tags)]
          );
        } else if (!artistRow.genres || artistRow.genres === '[]') {
          // Tags manquants : Update
          const tags = await getArtistTags(artistName);
          await db.query(
            "UPDATE artistes SET genres = $1 WHERE name = $2",
            [JSON.stringify(tags), artistName]
          );
        }
      })
    );

    // --- PHASE 2 : DURÉES DES PISTES ---
    // On ne traite que les pistes qui ne sont pas "en cours d'écoute" (ont une date)
    const tracksToProcess = tracks.filter(t => !!t.date);
    
    // On traite les durées par lots pour aller plus vite
    const scrobblesWithDuration = await Promise.all(
      tracksToProcess.map(async (s) => {
        let duration = 180000; // Fallback par défaut
        
        // Vérifier le cache local pour la durée
        const cachedRes = await db.query('SELECT duration_ms FROM pistes WHERE artist_name = $1 AND track_name = $2', [s.artist, s.name]);
        const cached = cachedRes.rows[0];
        
        if (cached) {
          duration = cached.duration_ms;
        } else {
          // Fetch API si pas en cache
          const info = await getTrackInfo(s.artist, s.name);
          if (info && info.duration) {
            duration = parseInt(info.duration, 10);
            if (duration <= 0) duration = 180000;
          }
          // Mise en cache asynchrone (on n'attend pas forcément pour continuer le calcul global)
          db.query(
            'INSERT INTO pistes (artist_name, track_name, duration_ms) VALUES ($1, $2, $3) ON CONFLICT (artist_name, track_name) DO NOTHING',
            [s.artist, s.name, duration]
          ).catch(e => console.error('Cache duration error:', e));
        }
        
        return { ...s, duration_ms: duration };
      })
    );

    // --- PHASE 3 : INSERTION DES ÉCOUTES ---
    // Utilisation d'une transaction pour accélérer les écritures Postgres
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const s of scrobblesWithDuration) {
        await client.query(`
          INSERT INTO ecoutes (user_id, track_name, artist_name, album_name, duration_ms, played_at_uts, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id, track_name, artist_name, played_at_uts) DO NOTHING
        `, [
          userId,
          s.name,
          s.artist,
          s.album,
          s.duration_ms,
          parseInt(s.date!, 10),
          s.image
        ]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`--- Turbo Sync complete for ${username} in ${duration}s. ---`);
    return { success: true, count: tracks.length, time: duration };

  } catch (error) {
    console.error('Turbo Sync failed:', error);
    return { success: false, error: (error as Error).message };
  }
}
