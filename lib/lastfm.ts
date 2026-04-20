import crypto from 'crypto';

const API_KEY = process.env.LASTFM_API_KEY;
const SHARED_SECRET = process.env.LASTFM_SHARED_SECRET;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export interface LastFmTrack {
  name: string;
  artist: string;
  album: string;
  image: string;
  date?: string;
  duration_ms: number;
  nowPlaying?: boolean;
}

export async function getRecentTracks(limit = 50, username: string, from?: number): Promise<LastFmTrack[]> {
  let url = `${BASE_URL}?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&limit=${limit}&format=json`;
  if (from) url += `&from=${from + 1}`; // +1 pour ne pas récupérer le dernier son déjà enregistré
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Last.fm API Error: ${res.status}`);
  
  const data = await res.json();
  const tracks = data.recenttracks.track || [];
  
  return tracks.map((t: any) => ({
    name: t.name,
    artist: typeof t.artist === 'object' ? t.artist['#text'] : t.artist,
    album: typeof t.album === 'object' ? t.album['#text'] : t.album,
    image: t.image && t.image.length > 0 ? t.image[t.image.length - 1]['#text'] : '',
    date: t.date ? t.date.uts : undefined,
    duration_ms: 180000,
    nowPlaying: t['@attr'] && t['@attr'].nowplaying === 'true'
  }));
}

const GENRE_BLACKLIST = new Set([
  'french', 'france', 'paris', 'lyon', 'marseille', 'atlanta', 'belgium', 'belgian', 
  'polish', 'nz', 'ivory coast', 'seen live', 'nouvelle ecole', 'favourite', 
  'favorites', 'loved', 'available', 'spotify', 'all', 'poetry', 'poetry spiewana'
]);

const GENRE_MAPPING: Record<string, string> = {
  // Hip-Hop
  'hip hop': 'Hip-Hop',
  'hip-hop': 'Hip-Hop',
  'hiphop': 'Hip-Hop',
  'underground hip-hop': 'Hip-Hop',
  'underground hip hop': 'Hip-Hop',
  'experimental hip hop': 'Hip-Hop',
  'french hip-hop': 'Hip-Hop',
  'jazz hop': 'Hip-Hop',
  
  // Rap
  'rap': 'Rap',
  'french rap': 'Rap',
  'rap français': 'Rap',
  'rap francais': 'Rap',
  'rap fr': 'Rap',
  'us rap': 'Rap',
  'horrorcore': 'Rap',
  
  // Drill & Trap (séparés comme demandé)
  'drill': 'Drill',
  'uk drill': 'Drill',
  'drill fr': 'Drill',
  'trap': 'Trap',
  'trap music': 'Trap',
  'trap fr': 'Trap',
  
  // Électronique
  'electronic': 'Électronique',
  'techno': 'Électronique',
  'minimal': 'Électronique',
  'minimal techno': 'Électronique',
  'tech house': 'Électronique',
  'deep house': 'Électronique',
  'electro': 'Électronique',
  'house': 'Électronique',
  'drum and bass': 'Drum & Bass',
  'neurofunk': 'Drum & Bass',
  
  // Rock & Métal
  'rock': 'Rock',
  'hard rock': 'Rock',
  'progressive rock': 'Rock',
  'post-punk': 'Rock',
  'metal': 'Métal',
  'progressive metal': 'Métal',
  'black metal': 'Métal',
  'death metal': 'Métal',
  'french metal': 'Métal',
  
  // Autres
  'pop': 'Pop',
  'french pop': 'Pop',
  'jazz': 'Jazz',
  'blues': 'Blues',
  'soul': 'Soul / R&B',
  'neo-soul': 'Soul / R&B',
  'rnb': 'Soul / R&B'
};

function normalizeGenre(tag: string): string | null {
  const lowTag = tag.toLowerCase().trim();
  
  if (GENRE_BLACKLIST.has(lowTag)) return null;
  
  // Recherche directe dans le mapping
  if (GENRE_MAPPING[lowTag]) return GENRE_MAPPING[lowTag];
  
  // Recherche partielle (ex: contient "rap")
  if (lowTag.includes('rap')) return 'Rap';
  if (lowTag.includes('techno') || lowTag.includes('house')) return 'Électronique';
  if (lowTag.includes('metal')) return 'Métal';
  
  // Par défaut, on capitalise la première lettre si ce n'est pas dans la liste mais que ça semble valide
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

export async function getArtistTags(artistName: string): Promise<string[]> {
  const url = `${BASE_URL}?method=artist.gettoptags&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    
    const data = await res.json();
    const tags = data.toptags?.tag || [];
    
    const normalizedTags = new Set<string>();
    
    for (const tagObj of tags) {
      const normalized = normalizeGenre(tagObj.name);
      if (normalized) {
        normalizedTags.add(normalized);
      }
      if (normalizedTags.size >= 5) break;
    }
    
    return Array.from(normalizedTags);
  } catch (err) {
    console.error(`Error fetching tags for ${artistName}:`, err);
    return [];
  }
}

export async function getArtistInfo(artistName: string) {
  const url = `${BASE_URL}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getTrackInfo(artistName: string, trackName: string) {
  const url = `${BASE_URL}?method=track.getInfo&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&api_key=${API_KEY}&format=json`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.track;
  } catch (err) {
    console.error(`Error fetching track info for ${trackName}:`, err);
    return null;
  }
}

/**
 * Calcule la signature API Last.fm obligatoire pour les méthodes d'authentification.
 */
export function calculateApiSig(params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  let s = '';
  keys.forEach(key => {
    if (key !== 'format' && key !== 'callback') {
      s += key + params[key];
    }
  });
  s += SHARED_SECRET;
  return crypto.createHash('md5').update(s, 'utf-8').digest('hex');
}

/**
 * Échange un jeton (token) temporaire contre une session utilisateur permanente.
 */
export async function getSession(token: string) {
  const params: Record<string, string> = {
    api_key: API_KEY!,
    method: 'auth.getSession',
    token: token
  };
  
  const apiSig = calculateApiSig(params);
  const url = `${BASE_URL}?method=auth.getSession&token=${token}&api_key=${API_KEY}&api_sig=${apiSig}&format=json`;
  
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.message || 'Impossible de récupérer la session Last.fm');
  }
  
  const data = await res.json();
  return data.session; // Contient { name, key }
}
