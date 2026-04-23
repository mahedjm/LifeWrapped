import { Palette } from './types';

export const PALETTES: Palette[] = [
  { id: 'spotify', name: 'Spotify', color: '#1DB954' },
  { id: 'apple', name: 'Apple Music', color: '#FC3C44' },
  { id: 'deezer', name: 'Deezer', color: '#A238FF' },
  { id: 'tidal', name: 'Tidal', color: '#00D2FF' }
];

export const TIME_PERIODS = [
  { id: 'week', label: '7 jours' },
  { id: 'month', label: '30 jours' },
  { id: 'year', label: '1 an' }
];

export const CHART_PERIODS = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' }
];
