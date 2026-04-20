import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { syncRecentlyPlayed } from '@/lib/sync';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('auth_session')?.value;
    const usernameCookie = (await cookies()).get('lastfm_username')?.value;

    if (!sessionCookie || !usernameCookie) {
      return NextResponse.json({ error: 'Unauthorized', isAuthenticated: false }, { status: 401 });
    }

    const userId = sessionCookie;
    const username = usernameCookie;

    const { searchParams } = new URL(request.url);
    const sync = searchParams.get('sync') === 'true';
    const artistPeriod = searchParams.get('artistPeriod') || 'month';
    const trackPeriod = searchParams.get('trackPeriod') || 'month';
    const chartPeriod = searchParams.get('chartPeriod') || 'week';
    
    const artistLimit = Math.min(100, Math.max(1, parseInt(searchParams.get('artistLimit') || '5', 10)));
    const trackLimit = Math.min(100, Math.max(1, parseInt(searchParams.get('trackLimit') || '5', 10)));

    if (sync) {
      const syncResult = await syncRecentlyPlayed(userId, username);
      if (!syncResult.success) {
        console.warn('Last.fm Sync ignored or failed:', syncResult.error);
      }
    }

    // On récupère la date du jour (YYYY-MM-DD) depuis l'horloge locale du serveur (UTC)
    // Idéalement, en PostgreSQL: to_char(NOW() AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD')
    
    // 1a. Today's listening time
    const todayRes = await db.query(`
      SELECT SUM(duration_ms) as total_ms 
      FROM ecoutes 
      WHERE to_char(to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD') = 
            to_char(NOW() AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD')
      AND user_id = $1
    `, [userId]);

    // 1b. Yesterday's listening time
    const yesterdayRes = await db.query(`
      SELECT SUM(duration_ms) as total_ms 
      FROM ecoutes 
      WHERE to_char(to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD') = 
            to_char((NOW() - INTERVAL '1 day') AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD')
      AND user_id = $1
    `, [userId]);

    // 2. Weekly Activity Calculation Dates
    const nowObj = new Date();
    const dayOfWeek = nowObj.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(nowObj);
    monday.setDate(nowObj.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0); // Début du lundi à minuit
    const mondayUTS = Math.floor(monday.getTime() / 1000);
    const prevMondayUTS = mondayUTS - (7 * 24 * 60 * 60);

    // Prev Week Total
    const prevWeekRes = await db.query(`
      SELECT SUM(duration_ms) as total_ms 
      FROM ecoutes 
      WHERE played_at_uts >= $1 AND played_at_uts < $2
      AND user_id = $3
    `, [prevMondayUTS, mondayUTS, userId]);
    const prevWeekTotal = prevWeekRes.rows[0]?.total_ms || 0;

    // Weekly Chart Data
    const weekData = [];
    const labels = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const res = await db.query(`
        SELECT SUM(duration_ms) as ms 
        FROM ecoutes 
        WHERE to_char(to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD') = $1
        AND user_id = $2
      `, [dateStr, userId]);
      weekData.push({ label: labels[i], ms: Number(res.rows[0]?.ms || 0) });
    }

    // Dynamic Chart Data
    let chartData = [];
    if (chartPeriod === 'year') {
      const currentYear = nowObj.getUTCFullYear().toString();
      const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      for (let m = 0; m < 12; m++) {
        const monthStr = (m + 1).toString().padStart(2, '0');
        const queryLike = `${currentYear}-${monthStr}`;
        const res = await db.query(`
          SELECT SUM(duration_ms) as ms 
          FROM ecoutes 
          WHERE to_char(to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'YYYY-MM') = $1
          AND user_id = $2
        `, [queryLike, userId]);
        chartData.push({ label: monthLabels[m], ms: Number(res.rows[0]?.ms || 0) });
      }
    } else if (chartPeriod === 'month') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const weekSlices = [
        { label: 'S1', start: 1, end: 7 },
        { label: 'S2', start: 8, end: 14 },
        { label: 'S3', start: 15, end: 21 },
        { label: 'S4', start: 22, end: 31 }
      ];
      
      for (const slice of weekSlices) {
        const res = await db.query(`
          SELECT SUM(duration_ms) as ms 
          FROM ecoutes 
          WHERE to_char(to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'YYYY-MM') = $1
          AND CAST(to_char(to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'DD') AS INTEGER) BETWEEN $2 AND $3
          AND user_id = $4
        `, [currentMonth, slice.start, slice.end, userId]);
        chartData.push({ label: slice.label, ms: Number(res.rows[0]?.ms || 0) });
      }
    } else {
      chartData = weekData;
    }

    // 3. Monthly total
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const monthRes = await db.query(`
      SELECT SUM(duration_ms) as total_ms 
      FROM ecoutes 
      WHERE to_char(to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'YYYY-MM') = $1
      AND user_id = $2
    `, [currentMonthStr, userId]);

    // 4. Previous month
    const dPrev = new Date();
    dPrev.setMonth(dPrev.getMonth() - 1);
    const prevMonthStr = dPrev.toISOString().slice(0, 7);
    const prevMonthRes = await db.query(`
      SELECT SUM(duration_ms) as total_ms 
      FROM ecoutes 
      WHERE to_char(to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'YYYY-MM') = $1
      AND user_id = $2
    `, [prevMonthStr, userId]);

    // 5. New Artists (Discovered this month)
    const startOfMonth = new Date(nowObj.getFullYear(), nowObj.getMonth(), 1);
    const startOfMonthUTS = Math.floor(startOfMonth.getTime() / 1000);
    const newArtistsRes = await db.query(`
      SELECT 
        artist_name as artist, 
        (SELECT image_url FROM artistes WHERE name = artist_name) as image_url,
        MIN(played_at_uts) as discovered_at
      FROM ecoutes
      WHERE user_id = $1
      GROUP BY artist_name
      HAVING MIN(played_at_uts) >= $2
      ORDER BY discovered_at DESC
      LIMIT 10
    `, [userId, startOfMonthUTS]);

    // 6. Top Artists & Tracks params
    const getPeriodFilterAndParams = (period: string) => {
      if (period === 'week') return { filter: "played_at_uts >= $1", value: mondayUTS.toString() };
      if (period === 'year') return { filter: "to_char(to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'YYYY') = $1", value: nowObj.getUTCFullYear().toString() };
      return { filter: "to_char(to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'YYYY-MM') = $1", value: currentMonthStr };
    };

    const artistSetup = getPeriodFilterAndParams(artistPeriod);
    const topArtistsRes = await db.query(`
      SELECT 
        artist_name as artist, 
        SUM(duration_ms) as total_ms,
        (SELECT image_url FROM artistes a WHERE a.name = artist_name) as image_url
      FROM ecoutes
      WHERE user_id = $1 AND ${artistSetup.filter.replace('$1', '$2')}
      GROUP BY artist_name
      ORDER BY total_ms DESC
      LIMIT $3
    `, [userId, artistSetup.value, artistLimit]);

    const trackSetup = getPeriodFilterAndParams(trackPeriod);
    const topTracksRes = await db.query(`
      SELECT 
        track_name as title, 
        artist_name as artist, 
        image_url,
        COUNT(*) as play_count
      FROM ecoutes
      WHERE user_id = $1 AND ${trackSetup.filter.replace('$1', '$2')}
      GROUP BY track_name, artist_name, image_url
      ORDER BY play_count DESC
      LIMIT $3
    `, [userId, trackSetup.value, trackLimit]);

    // 7. & 8. Average trends base data
    const firstEntryRes = await db.query('SELECT MIN(played_at_uts) as first_uts FROM ecoutes WHERE user_id = $1', [userId]);
    const firstUts = firstEntryRes.rows[0]?.first_uts || (Date.now() / 1000);
    const firstDate = firstEntryRes.rows[0]?.first_uts ? new Date(firstEntryRes.rows[0].first_uts * 1000).toISOString() : null;
    const totalWeeks = Math.max(1, (Date.now() / 1000 - firstUts) / (60 * 60 * 24 * 7));

    // Hourly Activity
    const hourlyActivity = [];
    for (let h = 0; h < 24; h++) {
      const hourStr = h.toString().padStart(2, '0');
      const res = await db.query(`
        SELECT SUM(duration_ms) as total_ms
        FROM ecoutes
        WHERE to_char(to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'HH24') = $1
        AND user_id = $2
      `, [hourStr, userId]);
      const avgMs = Number(res.rows[0]?.total_ms || 0) / totalWeeks;
      hourlyActivity.push({ label: `${hourStr}h`, ms: avgMs });
    }

    // Daily Activity
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const pgDowValues = ['1', '2', '3', '4', '5', '6', '0']; // PG EXTRACT(ISODOW) returns 1-7 (Mon-Sun).
    // Let's use ISODOW where 1=Monday, 7=Sunday
    const isoDowValues = [1, 2, 3, 4, 5, 6, 7];
    
    const dailyActivity = [];
    for (let i = 0; i < 7; i++) {
      const res = await db.query(`
        SELECT SUM(duration_ms) as total_ms
        FROM ecoutes
        WHERE EXTRACT(ISODOW FROM to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = $1
        AND user_id = $2
      `, [isoDowValues[i], userId]);
      const avgMs = Number(res.rows[0]?.total_ms || 0) / totalWeeks;
      dailyActivity.push({ label: dayNames[i], ms: avgMs });
    }

    // 9. Obsession
    const obsessionRes = await db.query(`
      SELECT 
        track_name as title, 
        artist_name as artist, 
        image_url,
        COUNT(*) as play_count
      FROM ecoutes
      WHERE to_timestamp(played_at_uts) >= NOW() - INTERVAL '2 days'
      AND user_id = $1
      GROUP BY track_name, artist_name, image_url
      ORDER BY play_count DESC, MAX(played_at_uts) DESC
      LIMIT 1
    `, [userId]);
    const obsession = obsessionRes.rows[0];

    return NextResponse.json({
      today: Number(todayRes.rows[0]?.total_ms || 0),
      yesterday: Number(yesterdayRes.rows[0]?.total_ms || 0),
      weekly: weekData,
      chartData,
      monthly: Number(monthRes.rows[0]?.total_ms || 0),
      previousMonthly: Number(prevMonthRes.rows[0]?.total_ms || 0),
      topArtists: topArtistsRes.rows.map(r => ({ ...r, total_ms: Number(r.total_ms) })),
      topTracks: topTracksRes.rows.map(r => ({ ...r, play_count: Number(r.play_count) })),
      hourlyActivity,
      dailyActivity,
      newArtists: newArtistsRes.rows,
      prevWeekTotal: Number(prevWeekTotal),
      obsession: obsession && Number(obsession.play_count) > 1 ? { ...obsession, play_count: Number(obsession.play_count) } : null,
      firstEntryDate: firstDate,
      isAuthenticated: true,
      username: username
    });
  } catch (error) {
    console.error('API Stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}
