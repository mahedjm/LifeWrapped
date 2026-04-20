import { NextResponse } from 'next/server';
import { getRecentTracks } from '@/lib/lastfm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const tracks = await getRecentTracks(1);
    const nowPlaying = tracks.length > 0 && tracks[0].nowPlaying ? tracks[0] : null;

    return NextResponse.json({ nowPlaying });
  } catch (error) {
    console.error('API Now Playing Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
