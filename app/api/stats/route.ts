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
    
    // 1a. Today's listening time (Optimized with Index)
    const todayRes = await db.query(`
      SELECT SUM(duration_ms) as total_ms 
      FROM ecoutes 
      WHERE user_id = $1
      AND played_at_uts >= extract(epoch from CURRENT_DATE at time zone 'Europe/Paris')
    `, [userId]);

    // 1b. Yesterday's listening time (Optimized with Index)
    const yesterdayRes = await db.query(`
      SELECT SUM(duration_ms) as total_ms 
      FROM ecoutes 
      WHERE user_id = $1
      AND played_at_uts >= extract(epoch from (CURRENT_DATE - INTERVAL '1 day') at time zone 'Europe/Paris')
      AND played_at_uts < extract(epoch from CURRENT_DATE at time zone 'Europe/Paris')
    `, [userId]);

    // 2. Weekly Activity Calculation Dates
    const nowObj = new Date();
    const dayOfWeek = nowObj.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(nowObj);
    monday.setDate(nowObj.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const mondayUTS = Math.floor(monday.getTime() / 1000);
    const endOfWeekUTS = mondayUTS + (7 * 24 * 60 * 60);
    const prevMondayUTS = mondayUTS - (7 * 24 * 60 * 60);

    // Prev Week Total (Optimized)
    const prevWeekRes = await db.query(`
      SELECT SUM(duration_ms) as total_ms 
      FROM ecoutes 
      WHERE user_id = $3 AND played_at_uts >= $1 AND played_at_uts < $2
    `, [prevMondayUTS, mondayUTS, userId]);
    const prevWeekTotal = prevWeekRes.rows[0]?.total_ms || 0;

    // 3. Chart Data Optimization (Single Query instead of loops)
    const labels = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    // WEEKLY DATA (Always needed for the small activity chart)
    const weekRes = await db.query(`
      SELECT 
        EXTRACT(ISODOW FROM to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as dow,
        SUM(duration_ms) as ms
      FROM ecoutes
      WHERE user_id = $1 AND played_at_uts >= $2 AND played_at_uts < $3
      GROUP BY dow
    `, [userId, mondayUTS, endOfWeekUTS]);
    
    const dowMap = Object.fromEntries(weekRes.rows.map(r => [Math.floor(r.dow), Number(r.ms)]));
    const weekData = labels.map((l, i) => ({ label: l, ms: dowMap[i + 1] || 0 }));

    let chartData = [];
    if (chartPeriod === 'year') {
      const yearStartUTS = Math.floor(new Date(nowObj.getUTCFullYear(), 0, 1).getTime() / 1000);
      const yearEndUTS = Math.floor(new Date(nowObj.getUTCFullYear() + 1, 0, 1).getTime() / 1000);
      
      const yearRes = await db.query(`
        SELECT 
          EXTRACT(MONTH FROM to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as month_num,
          SUM(duration_ms) as ms
        FROM ecoutes
        WHERE user_id = $1 AND played_at_uts >= $2 AND played_at_uts < $3
        GROUP BY month_num
      `, [userId, yearStartUTS, yearEndUTS]);
      
      const monthMap = Object.fromEntries(yearRes.rows.map(r => [Math.floor(r.month_num), Number(r.ms)]));
      chartData = monthLabels.map((l, i) => ({ label: l, ms: monthMap[i + 1] || 0 }));

    } else if (chartPeriod === 'month') {
      const monthStart = new Date(nowObj.getFullYear(), nowObj.getMonth(), 1);
      const monthStartUTS = Math.floor(monthStart.getTime() / 1000);
      const nextMonthStartUTS = Math.floor(new Date(nowObj.getFullYear(), nowObj.getMonth() + 1, 1).getTime() / 1000);
      
      const monthSelectRes = await db.query(`
        SELECT 
          FLOOR((EXTRACT(DAY FROM to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') - 1) / 7) as week_idx,
          SUM(duration_ms) as ms
        FROM ecoutes
        WHERE user_id = $1 AND played_at_uts >= $2 AND played_at_uts < $3
        GROUP BY week_idx
      `, [userId, monthStartUTS, nextMonthStartUTS]);
      
      const weekMap = Object.fromEntries(monthSelectRes.rows.map(r => [Math.floor(r.week_idx), Number(r.ms)]));
      chartData = [
        { label: 'S1', ms: weekMap[0] || 0 },
        { label: 'S2', ms: weekMap[1] || 0 },
        { label: 'S3', ms: weekMap[2] || 0 },
        { label: 'S4', ms: weekMap[3] || weekMap[4] || 0 }
      ];

    } else {
      chartData = weekData;
    }

    // 4. Monthly totals (Optimized)
    const curMonthStartUTS = Math.floor(new Date(nowObj.getFullYear(), nowObj.getMonth(), 1).getTime() / 1000);
    const curMonthEndUTS = Math.floor(new Date(nowObj.getFullYear(), nowObj.getMonth() + 1, 1).getTime() / 1000);
    const prevMonthStartUTS = Math.floor(new Date(nowObj.getFullYear(), nowObj.getMonth() - 1, 1).getTime() / 1000);
    
    const monthRes = await db.query(`
      SELECT SUM(duration_ms) as total_ms FROM ecoutes WHERE user_id = $1 AND played_at_uts >= $2 AND played_at_uts < $3
    `, [userId, curMonthStartUTS, curMonthEndUTS]);

    const prevMonthRes = await db.query(`
      SELECT SUM(duration_ms) as total_ms FROM ecoutes WHERE user_id = $1 AND played_at_uts >= $2 AND played_at_uts < $3
    `, [userId, prevMonthStartUTS, curMonthStartUTS]);

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

    // 6. Top Artists & Tracks params (Optimized)
    const getUtsRange = (period: string) => {
      if (period === 'week') return { start: mondayUTS, end: endOfWeekUTS };
      if (period === 'year') return { 
        start: Math.floor(new Date(nowObj.getUTCFullYear(), 0, 1).getTime() / 1000),
        end: Math.floor(new Date(nowObj.getUTCFullYear() + 1, 0, 1).getTime() / 1000)
      };
      return { start: curMonthStartUTS, end: curMonthEndUTS };
    };

    const artistRange = getUtsRange(artistPeriod);
    const topArtistsRes = await db.query(`
      SELECT 
        artist_name as artist, 
        SUM(duration_ms) as total_ms,
        (SELECT image_url FROM artistes a WHERE a.name = artist_name) as image_url
      FROM ecoutes
      WHERE user_id = $1 AND played_at_uts >= $2 AND played_at_uts < $3
      GROUP BY artist_name
      ORDER BY total_ms DESC
      LIMIT $4
    `, [userId, artistRange.start, artistRange.end, artistLimit]);

    const trackRange = getUtsRange(trackPeriod);
    const topTracksRes = await db.query(`
      SELECT 
        track_name as title, 
        artist_name as artist, 
        image_url,
        COUNT(*) as play_count
      FROM ecoutes
      WHERE user_id = $1 AND played_at_uts >= $2 AND played_at_uts < $3
      GROUP BY track_name, artist_name, image_url
      ORDER BY play_count DESC
      LIMIT $4
    `, [userId, trackRange.start, trackRange.end, trackLimit]);

    // 7. Average trends base data (Optimized)
    const firstEntryRes = await db.query('SELECT MIN(played_at_uts) as first_uts FROM ecoutes WHERE user_id = $1', [userId]);
    const firstUts = firstEntryRes.rows[0]?.first_uts || (Date.now() / 1000);
    const firstDate = firstEntryRes.rows[0]?.first_uts ? new Date(firstEntryRes.rows[0].first_uts * 1000).toISOString() : null;
    const totalWeeks = Math.max(1, (Date.now() / 1000 - firstUts) / (60 * 60 * 24 * 7));

    // Hourly Activity (Single Query Optimization)
    const hourlyRes = await db.query(`
      SELECT 
        EXTRACT(HOUR FROM to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as hour,
        SUM(duration_ms) as total_ms
      FROM ecoutes
      WHERE user_id = $1
      GROUP BY hour
    `, [userId]);
    const hourlyMap = Object.fromEntries(hourlyRes.rows.map(r => [Math.floor(r.hour), Number(r.total_ms)]));
    const hourlyActivity = Array.from({ length: 24 }, (_, h) => ({
      label: `${h.toString().padStart(2, '0')}h`,
      ms: (hourlyMap[h] || 0) / totalWeeks
    }));

    // Daily Activity (Single Query Optimization)
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const dailyRes = await db.query(`
      SELECT 
        EXTRACT(ISODOW FROM to_timestamp(played_at_uts) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as dow,
        SUM(duration_ms) as total_ms
      FROM ecoutes
      WHERE user_id = $1
      GROUP BY dow
    `, [userId]);
    const dailyMap = Object.fromEntries(dailyRes.rows.map(r => [Math.floor(r.dow), Number(r.total_ms)]));
    const dailyActivity = dayNames.map((l, i) => ({
      label: l,
      ms: (dailyMap[i + 1] || 0) / totalWeeks
    }));

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
