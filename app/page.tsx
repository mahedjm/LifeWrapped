'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Clock, Calendar, BarChart3, RefreshCw, AlertCircle, Music, ChevronDown, PieChart, HelpCircle } from 'lucide-react';
import DashboardChart from '@/components/DashboardChart';
import DashboardLineChart from '@/components/DashboardLineChart';
import NowPlaying from '@/components/NowPlaying';
import ShareCard from '@/components/ShareCard';
import { useRef } from 'react';
import { Share2, LogOut, User } from 'lucide-react';

interface Stats {
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

const PALETTES = [
  { id: 'spotify', name: 'Spotify', color: '#1DB954' },
  { id: 'apple', name: 'Apple Music', color: '#FC3C44' },
  { id: 'deezer', name: 'Deezer', color: '#A238FF' },
  { id: 'tidal', name: 'Tidal', color: '#00D2FF' }
];

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<any>(null);
  const [themeColor, setThemeColor] = useState('#1DB954');
  const lastTrackId = useRef<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [trackPeriod, setTrackPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [genrePeriod, setGenrePeriod] = useState<'week' | 'month' | 'year'>('month');
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [artistLimit, setArtistLimit] = useState<number>(5);
  const [trackLimit, setTrackLimit] = useState<number>(5);
  const [showArtistLimit, setShowArtistLimit] = useState(false);
  const [showTrackLimit, setShowTrackLimit] = useState(false);

  // Persistence du thème
  useEffect(() => {
    const saved = localStorage.getItem('lw-theme-color');
    if (saved) setThemeColor(saved);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-green', themeColor);
    localStorage.setItem('lw-theme-color', themeColor);
  }, [themeColor]);

  const fetchStats = async (
    sync = false, 
    currentArtistPeriod = period, 
    currentTrackPeriod = trackPeriod, 
    currentChartPeriod = chartPeriod,
    currentArtistLimit = artistLimit,
    currentTrackLimit = trackLimit
  ) => {
    if (sync) setSyncing(true);
    try {
      console.log('Fetching stats...', { currentArtistPeriod, currentTrackPeriod, currentChartPeriod });
      const url = new URL('/api/stats', window.location.origin);
      if (sync) url.searchParams.set('sync', 'true');
      url.searchParams.set('artistPeriod', currentArtistPeriod);
      url.searchParams.set('trackPeriod', currentTrackPeriod);
      url.searchParams.set('chartPeriod', currentChartPeriod);
      url.searchParams.set('artistLimit', currentArtistLimit.toString());
      url.searchParams.set('trackLimit', currentTrackLimit.toString());
      
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Erreur serveur: ${res.status}`);
      }
      const data = await res.json();
      console.log('Stats received:', data);
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError("Erreur lors de la récupération des données.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  // Polling pour le Mode Party (Now Playing) + Smart Sync
  useEffect(() => {
    const checkNowPlaying = async () => {
      try {
        const res = await fetch('/api/now-playing');
        const data = await res.json();
        
        const currentTrack = data.nowPlaying;
        const currentId = currentTrack ? `${currentTrack.artist}-${currentTrack.name}` : null;
        
        // Smart Sync Logic: Si on passe d'un morceau à un autre, ou d'un morceau à rien
        // cela signifie qu'un scrobble a probablement été validé sur Last.fm.
        if (lastTrackId.current && lastTrackId.current !== currentId) {
          console.log('Smart Sync Triggered: Track changed or ended.');
          // On attend 2 secondes que Last.fm valide bien le scrobble de son côté
          setTimeout(() => fetchStats(true), 2000);
        }
        
        lastTrackId.current = currentId;
        setNowPlaying(currentTrack);
      } catch (e) {
        console.error('Failed to fetch now playing', e);
      }
    };

    checkNowPlaying();
    const interval = setInterval(checkNowPlaying, 4000); // 4 secondes pour une réactivité optimale

    // Vérification immédiate quand vous revenez sur l'onglet
    window.addEventListener('focus', checkNowPlaying);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkNowPlaying);
    };
  }, []);

  useEffect(() => {
    fetchStats(false, period, trackPeriod, chartPeriod, artistLimit, trackLimit);
  }, [period, trackPeriod, chartPeriod, artistLimit, trackLimit]);

  const formatTime = (ms: number) => {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  const InfoTooltip = ({ text }: { text: string }) => (
    <span className="tooltip-container">
      <HelpCircle size={14} className="tooltip-icon" />
      <span className="tooltip-text">{text}</span>
    </span>
  );

  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleExport = async () => {
    if (!shareCardRef.current || !stats) return;
    
    setSyncing(true); // Re-use syncing state for visual feedback
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      // Petit délai pour s'assurer que les images sont chargées
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(shareCardRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#0a0a0a',
        scale: 2, // Meilleure qualité
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `LifeWrapped_Week_${new Date().toISOString().split('T')[0]}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Échec de la génération de l\'image.');
    } finally {
      setSyncing(false);
    }
  };

  const calculateTrend = () => {
    if (!stats || !stats.previousMonthly) return null;
    const diff = ((stats.monthly - stats.previousMonthly) / stats.previousMonthly) * 100;
    return {
      value: Math.abs(diff).toFixed(0) + '%',
      isUp: diff > 0
    };
  };

  if (loading) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={48} color="var(--accent-green)" style={{ marginBottom: '20px' }} />
          <p>Initialisation de Écho...</p>
        </div>
      </div>
    );
  }

  const hasData = stats && stats.weekly && stats.weekly.some(d => d.ms > 0);
  const weeklyTotalMs = stats?.weekly?.reduce((acc, curr) => acc + curr.ms, 0) || 0;

  return (
    <main className="dashboard animated">
      <header className="main-header">
        <div className="header-top">
          <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #1DB954, #00c9ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Écho</h1>
          
          {stats?.username && (
            <div className="user-badge">
              <div className="user-info">
                <User size={14} />
                <span className="mobile-hide">Connecté en tant que&nbsp;</span>
                <strong>{stats.username}</strong>
              </div>
              <button 
                onClick={handleLogout}
                className="logout-btn"
                title="Déconnexion"
                style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '5px', padding: '5px' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
              >
                <LogOut size={18} />
                <span className="mobile-hide" style={{ fontSize: '0.8rem' }}>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="header-controls">
          <div className="ambiance-selector" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p className="mobile-hide" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Ambiance :</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              {PALETTES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setThemeColor(p.color)}
                  title={p.name}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: p.color,
                    border: themeColor === p.color ? '2px solid white' : 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    padding: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="btn btn-secondary" 
              onClick={() => fetchStats(true)} 
              disabled={syncing}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              <span className="mobile-hide">{syncing ? 'Synchronisation...' : 'Synchroniser'}</span>
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleExport}
              disabled={syncing || !stats}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: `${themeColor}26`, 
                color: themeColor,
                border: `1px solid ${themeColor}4d`
              }}
            >
              <Share2 size={18} />
              <span className="mobile-hide">Partager</span>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="card" style={{ marginBottom: '30px', borderColor: '#ff4444', backgroundColor: 'rgba(255, 68, 68, 0.05)' }}>
          <p style={{ color: '#ff4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} /> {error}
          </p>
        </div>
      )}

      {/* Mode Party (En direct) */}
      <NowPlaying track={nowPlaying} />

      {/* Hidden Share Card for Export */}
      <ShareCard 
        ref={shareCardRef} 
        themeColor={themeColor}
        stats={stats ? {
          topArtists: stats.topArtists,
          weeklyTotalMs: stats.weekly?.reduce((acc, curr) => acc + curr.ms, 0) || 0,
          obsession: stats.obsession
        } : null} 
      />

      <div className="section-badge-container" style={{ 
        marginBottom: '25px', 
        color: 'var(--text-primary)', 
        marginTop: '20px' 
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
          padding: '8px 24px',
          borderRadius: '50px',
          border: '1px solid color-mix(in srgb, var(--accent-green), transparent 80%)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <Activity size={18} color="var(--accent-green)" />
          <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Résumé d'écoute
            <InfoTooltip text="Statistiques globales basées sur l'intégralité de votre historique local." />
          </h2>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card animated" style={{ animationDelay: '0.1s' }}>
          <div className="card-title">Aujourd'hui</div>
          <div className="card-value">{formatTime(stats?.today || 0)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            {stats?.yesterday !== undefined && stats.yesterday > 0 && (() => {
              const diffToYesterday = ((stats.today - stats.yesterday) / stats.yesterday) * 100;
              const isPos = diffToYesterday >= 0;
              return (
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  color: isPos ? '#1ed760' : '#ff4d4d',
                  background: isPos ? 'rgba(30, 215, 96, 0.1)' : 'rgba(255, 77, 77, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {isPos ? '▲' : '▼'} {Math.abs(diffToYesterday).toFixed(0)}%
                </span>
              );
            })()}
            <span className="card-sub">vs hier</span>
          </div>
        </div>

        <div className="card animated" style={{ animationDelay: '0.2s' }}>
          <div className="card-title">Cette Semaine</div>
          <div className="card-value">{formatTime(weeklyTotalMs)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            {stats?.prevWeekTotal !== undefined && stats.prevWeekTotal > 0 && (() => {
              const diffToPrev = ((weeklyTotalMs - stats.prevWeekTotal) / stats.prevWeekTotal) * 100;
              const isPos = diffToPrev >= 0;
              return (
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  color: isPos ? '#1ed760' : '#ff4d4d',
                  background: isPos ? 'rgba(30, 215, 96, 0.1)' : 'rgba(255, 77, 77, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {isPos ? '▲' : '▼'} {Math.abs(diffToPrev).toFixed(0)}%
                </span>
              );
            })()}
            <span className="card-sub">vs semaine dernière</span>
          </div>
        </div>

        <div className="card animated" style={{ animationDelay: '0.3s' }}>
          <div className="card-title">Top Intensité</div>
          <div className="card-value">
            {stats?.weekly?.length ? formatTime(Math.max(...stats.weekly.map(d => d.ms))) : '0 min'}
          </div>
          <div className="card-sub">Record quotidien des 7 derniers jours</div>
        </div>
      </div>


      {/* Section Obsession */}
      {stats?.obsession && (
        <div className="card animated obsession-card" style={{ 
          animationDelay: '0.35s', 
          marginBottom: '30px', 
          background: `linear-gradient(135deg, color-mix(in srgb, var(--accent-green), transparent 90%) 0%, rgba(0,0,0,0) 100%)`, 
          border: '1px solid color-mix(in srgb, var(--accent-green), transparent 70%)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px', 
          padding: '24px' 
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.4)', position: 'relative' }}>
              <img src={stats.obsession.image_url} alt={stats.obsession.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800 }}>🔥 CHAUD</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Obsession du moment
              <InfoTooltip text="Le morceau que vous avez le plus écouté au cours des dernières 48 heures." />
            </div>
            <h3 style={{ fontSize: '1.5rem', margin: '0 0 5px 0', fontWeight: 800 }}>{stats.obsession.title}</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0 }}>{stats.obsession.artist}</p>
            <div style={{ marginTop: '12px', display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 800, color: 'white' }}>{stats.obsession.play_count}</span> écoutes sur les dernières 48h
            </div>
          </div>
        </div>
      )}

      <div className="chart-container animated" style={{ animationDelay: '0.4s' }}>
        <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <BarChart3 color="var(--accent-green)" />
            <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              Activité {chartPeriod === 'week' ? 'Hebdomadaire' : chartPeriod === 'month' ? 'Mensuelle' : 'Annuelle'}
              <InfoTooltip text="Volume total d'écoute (en heures) cumulé sur la période sélectionnée." />
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '24px', border: '1px solid var(--glass-border)', overflowX: 'auto', maxWidth: '100%' }}>
            {[ { id: 'week', label: 'Semaine' }, { id: 'month', label: 'Mois' }, { id: 'year', label: 'Année' } ].map(p => (
              <button
                key={p.id}
                onClick={() => setChartPeriod(p.id as any)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: chartPeriod === p.id ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                  color: chartPeriod === p.id ? 'var(--accent-green)' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasData && stats?.chartData ? (
            <DashboardChart data={stats.chartData} color={themeColor} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Music size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p>Écoutez des morceaux pour générer le graphique.</p>
            </div>
          )}
        </div>
      </div>

      <div className="section-badge-container" style={{ 
        marginBottom: '25px', 
        color: 'var(--text-primary)', 
        marginTop: '50px' 
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
          padding: '8px 24px',
          borderRadius: '50px',
          border: '1px solid color-mix(in srgb, var(--accent-green), transparent 80%)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <Calendar size={18} color="var(--accent-green)" />
          <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Habitudes d'Écoute
          </h2>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', 
        gap: '24px', 
        marginBottom: '40px' 
      }}>
        {/* Graphique des Heures */}
        <div className="chart-container animated" style={{ margin: 0, animationDelay: '0.5s' }}>
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={18} color="var(--accent-green)" />
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                Heures de Pointe
                <InfoTooltip text="Moyenne hebdomadaire de votre temps d'écoute par heure. Montre votre routine type." />
              </h3>
            </div>
          </div>
          <div style={{ height: '220px' }}>
            {stats?.hourlyActivity ? (
              <DashboardLineChart data={stats.hourlyActivity} color={themeColor} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Chargement...
              </div>
            )}
          </div>
          <div style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {stats?.hourlyActivity && (
              <>
                Votre pic d'écoute se situe vers{' '}
                <strong style={{ color: 'var(--accent-green)' }}>
                  {[...stats.hourlyActivity].sort((a,b) => b.ms - a.ms)[0].label}
                </strong>
              </>
            )}
          </div>
        </div>

        {/* Graphique des Jours */}
        <div className="chart-container animated" style={{ margin: 0, animationDelay: '0.6s' }}>
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 size={18} color="var(--accent-green)" />
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                Jours préférés
                <InfoTooltip text="Répartition moyenne de votre temps d'écoute sur les 7 jours de la semaine." />
              </h3>
            </div>
          </div>
          <div style={{ height: '220px' }}>
            {stats?.dailyActivity ? (
              <DashboardChart data={stats.dailyActivity} color={themeColor} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Chargement...
              </div>
            )}
          </div>
          <div style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {stats?.dailyActivity && (
              <>
                Le <strong style={{ color: 'var(--accent-green)' }}>
                  {(() => {
                    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                    const dayNamesShort = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                    const bestDayShort = [...stats.dailyActivity].sort((a,b) => b.ms - a.ms)[0].label;
                    const index = dayNamesShort.indexOf(bestDayShort);
                    return days[index];
                  })()}
                </strong> est votre jour de prédilection.
              </>
            )}
          </div>
        </div>
      </div>



      {stats?.topArtists && stats.topArtists.length > 0 && (
        <div className="chart-container animated" style={{ animationDelay: '0.5s' }}>
          <div className="chart-header">
            {/* Rangée 1 : Badge Titre Centré (sur mobile) */}
            <div className="section-badge-container">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
                padding: '6px 20px',
                borderRadius: '50px',
                border: '1px solid color-mix(in srgb, var(--accent-green), transparent 80%)'
              }}>
                <Music size={16} color="var(--accent-green)" />
                <h3 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Top {artistLimit} Artistes
                  <InfoTooltip text="Vos artistes les plus écoutés sur la période sélectionnée." />
                </h3>
              </div>
            </div>

            {/* Rangée 2 : Contrôles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {(period === 'month' || period === 'year') && stats?.firstEntryDate && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#ffb91d', 
                    background: 'rgba(255, 185, 29, 0.1)', 
                    padding: '2px 8px', 
                    borderRadius: '10px',
                    fontWeight: 500
                  }}>
                    (Période incomplète)
                  </span>
                )}
              </div>
            
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setShowArtistLimit(!showArtistLimit)}
                    className="custom-select-btn"
                  >
                    Top {artistLimit} <ChevronDown size={14} />
                  </button>
                  {showArtistLimit && (
                    <div className="custom-select-menu">
                      {[5, 10, 25, 50].map(l => (
                        <div 
                          key={l}
                          className={`custom-select-item ${artistLimit === l ? 'active' : ''}`}
                          onClick={() => { setArtistLimit(l); setShowArtistLimit(false); }}
                        >
                          Top {l}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '6px', 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '6px', 
                  borderRadius: '24px',
                  border: '1px solid var(--glass-border)'
                }}>
                  {['week', 'month', 'year'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p as any)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: period === p ? 'color-mix(in srgb, var(--accent-green), transparent 90%)' : 'transparent',
                        color: period === p ? 'var(--accent-green)' : 'var(--text-secondary)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div 
            className="scrollable-list" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px', 
              maxHeight: artistLimit > 5 ? '400px' : 'none', 
              overflowY: artistLimit > 5 ? 'auto' : 'visible', 
              paddingRight: artistLimit > 5 ? '12px' : '0' 
            }}
          >
            {stats.topArtists.map((a, index) => {
              const maxMs = stats.topArtists[0].total_ms;
              const percentage = (a.total_ms / maxMs) * 100;
              return (
                <div key={a.artist} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '50%', 
                      overflow: 'hidden', 
                      background: 'rgba(255,255,255,0.05)',
                      border: '2px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {a.image_url ? (
                        <img src={a.image_url} alt={a.artist} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Music size={20} color="var(--text-secondary)" />
                      )}
                    </div>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '-5px', 
                      right: '-5px', 
                      background: 'var(--accent-green)', 
                      color: '#000', 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--bg-dark)'
                    }}>
                      {index + 1}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                      <span style={{ fontWeight: 600 }}>{a.artist}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatTime(a.total_ms)}</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        background: 'var(--accent-green)', 
                        borderRadius: '3px',
                        transition: 'width 1s ease-out'
                      }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats?.topTracks && stats.topTracks.length > 0 && (
        <div className="chart-container animated" style={{ animationDelay: '0.6s' }}>
          <div className="chart-header">
            {/* Rangée 1 : Badge Titre Centré (sur mobile) */}
            <div className="section-badge-container">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
                padding: '6px 20px',
                borderRadius: '50px',
                border: '1px solid color-mix(in srgb, var(--accent-green), transparent 80%)'
              }}>
                <Clock size={16} color="var(--accent-green)" />
                <h3 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Top {trackLimit} Titres
                  <InfoTooltip text="Vos morceaux les plus écoutés sur la période sélectionnée." />
                </h3>
              </div>
            </div>

            {/* Rangée 2 : Contrôles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {(trackPeriod === 'month' || trackPeriod === 'year') && stats?.firstEntryDate && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#ffb91d', 
                    background: 'rgba(255, 185, 29, 0.1)', 
                    padding: '2px 8px', 
                    borderRadius: '10px',
                    fontWeight: 500
                  }}>
                    (Période incomplète)
                  </span>
                )}
              </div>
            
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setShowTrackLimit(!showTrackLimit)}
                    className="custom-select-btn"
                  >
                    Top {trackLimit} <ChevronDown size={14} />
                  </button>
                  {showTrackLimit && (
                    <div className="custom-select-menu">
                      {[5, 10, 25, 50].map(l => (
                        <div 
                          key={l}
                          className={`custom-select-item ${trackLimit === l ? 'active' : ''}`}
                          onClick={() => { setTrackLimit(l); setShowTrackLimit(false); }}
                        >
                          Top {l}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '6px', 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '6px', 
                  borderRadius: '24px',
                  border: '1px solid var(--glass-border)'
                }}>
                  {['week', 'month', 'year'].map(p => (
                    <button
                      key={p}
                      onClick={() => setTrackPeriod(p as any)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: trackPeriod === p ? 'color-mix(in srgb, var(--accent-green), transparent 90%)' : 'transparent',
                        color: trackPeriod === p ? 'var(--accent-green)' : 'var(--text-secondary)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div 
            className="scrollable-list" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px', 
              maxHeight: trackLimit > 5 ? '400px' : 'none', 
              overflowY: trackLimit > 5 ? 'auto' : 'visible', 
              paddingRight: trackLimit > 5 ? '12px' : '0' 
            }}
          >
            {stats.topTracks.map((t, index) => {
              const maxCount = stats.topTracks[0].play_count;
              const percentage = (t.play_count / maxCount) * 100;
              return (
                <div key={`${t.title}-${t.artist}`} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '8px', // Carré arrondi pour les morceaux
                      overflow: 'hidden', 
                      background: 'rgba(255,255,255,0.05)',
                      border: '2px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {t.image_url ? (
                        <img src={t.image_url} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Music size={20} color="var(--text-secondary)" />
                      )}
                    </div>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '-5px', 
                      right: '-5px', 
                      background: 'var(--accent-green)', 
                      color: '#000', 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--bg-dark)'
                    }}>
                      {index + 1}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%', overflow: 'hidden' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.artist}</span>
                      </div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {t.play_count} {t.play_count > 1 ? 'écoutes' : 'écoute'}
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        background: 'var(--accent-green)', 
                        borderRadius: '3px',
                        transition: 'width 1s ease-out'
                      }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        
        .custom-select-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.05);
          color: var(--text-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
          height: 34px;
        }
        .custom-select-btn:hover {
          color: white;
          background: rgba(255,255,255,0.1);
        }
        
        .custom-select-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: #181818;
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          overflow: hidden;
          z-index: 100;
          min-width: 100%;
          box-shadow: 0 8px 16px rgba(0,0,0,0.5);
        }
        .custom-select-item {
          padding: 8px 16px;
          font-size: 0.85rem;
          cursor: pointer;
          color: var(--text-secondary);
          transition: background 0.2s;
        }
        .custom-select-item:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        .custom-select-item.active {
          color: var(--accent-green);
          background: color-mix(in srgb, var(--accent-green), transparent 90%);
          font-weight: 600;
        }

        .scrollable-list::-webkit-scrollbar {
          width: 6px;
        }
        .scrollable-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .scrollable-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .scrollable-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .discover-avatar:hover { 
          transform: scale(1.1) rotate(5deg); 
          border-color: var(--accent-green); 
        }
        
        /* Hide scrollbar for discovery row */
        .discovery-row::-webkit-scrollbar { 
          display: none; 
        }

          .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 25px;
          }
          .chart-header > div {
            justify-content: flex-start;
          }
          .section-badge-container {
            display: flex;
            justify-content: flex-start;
          }
          
          @media (max-width: 600px) {
            .main-header {
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-bottom: 30px !important;
            }
            .header-controls {
              flex-direction: column;
              align-items: center;
              width: 100%;
            }
            .action-buttons, .ambiance-selector {
              justify-content: center;
              width: 100%;
            }
            .section-header {
              flex-direction: column;
              text-align: center;
            }
            .chart-header {
              flex-direction: column;
              justify-content: center !important;
              text-align: center;
            }
            .chart-header > div {
              justify-content: center !important;
            }
            .section-badge-container {
              width: 100%;
              margin-bottom: 15px;
              justify-content: center !important;
            }
            .chart-container {
              padding: 15px !important;
            }
            .dashboard {
              padding: 20px 10px !important;
            }
            .card {
              padding: 15px !important;
            }
          }

          .main-header { margin-bottom: 50px; }
          .header-controls { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; width: 100%; }
          .action-buttons { display: flex; gap: 12px; }
          .ambiance-selector { display: flex; align-items: center; gap: 15px; }
      `}</style>
    </main>
  );
}
