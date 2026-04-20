import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRecentTracks } from '@/lib/lastfm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const username = cookieStore.get('lastfm_username')?.value;

    if (!username) {
      return NextResponse.json({ nowPlaying: null });
    }

    const tracks = await getRecentTracks(1, username);
    const nowPlaying = tracks.length > 0 && tracks[0].nowPlaying ? tracks[0] : null;

    return NextResponse.json({ nowPlaying });
  } catch (error) {
    console.error('API Now Playing Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
