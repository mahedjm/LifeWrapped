export interface Stats {
  username?: string;
  today: number;
  yesterday?: number;
  weekly: { date: string; ms: number }[];
  monthly: number;
  previousMonthly: number;
  topArtists: { artist: string; total_ms: number; image_url: string | null }[];
  topTracks: { title: string; artist: string; play_count: number; image_url: string | null }[];
  chartData?: { date?: string; label?: string; ms: number }[];
  hourlyActivity?: { label: string; ms: number }[];
  dailyActivity?: { label: string; ms: number }[];
  newArtists: { artist: string; image_url: string | null; discovered_at: number }[];
  prevWeekTotal: number;
  obsession?: { title: string; artist: string; image_url: string; play_count: number } | null;
  firstEntryDate: string | null;
  isAuthenticated: boolean;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface Palette {
  id: string;
  name: string;
  color: string;
}
