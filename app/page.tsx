'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, Clock, Calendar, BarChart3, RefreshCw, 
  AlertCircle, Music, ChevronDown, PieChart, HelpCircle, 
  Share2, LogOut, User, Palette, Users, Bell, 
  Search, TrendingUp, Award, Grid, Zap, Info, Layers
} from 'lucide-react';
import DashboardChart from '@/components/DashboardChart';
import DashboardLineChart from '@/components/DashboardLineChart';
import NowPlaying from '@/components/NowPlaying';
import ShareCard from '@/components/ShareCard';
import InfoTooltip from '@/components/InfoTooltip';

// Libs & Hooks
import { Stats } from '@/lib/types';
import { PALETTES, TIME_PERIODS, CHART_PERIODS } from '@/lib/constants';
import { useStats } from '@/hooks/useStats';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { formatTime, formatDiffTime } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  
  // States for filters (UI specific)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [trackPeriod, setTrackPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [artistLimit, setArtistLimit] = useState<number>(5);
  const [trackLimit, setTrackLimit] = useState<number>(5);
  const [showArtistLimit, setShowArtistLimit] = useState(false);
  const [showTrackLimit, setShowTrackLimit] = useState(false);
  const [activeTab, setActiveTab] = useState('accueil');
  const [showPalette, setShowPalette] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  
  // Custom Hooks (Logic extraction)
  const { themeColor, setThemeColor } = useTheme();
  const { 
    stats, setStats, loading, syncing, manualSyncing, 
    loadingChart, setLoadingChart, error, fetchStats 
  } = useStats(period, trackPeriod, chartPeriod, artistLimit, trackLimit);
  const { 
    showNotifications, setShowNotifications, notifications, toggleNotifications 
  } = useNotifications();

  // Navigation & UI references
  const [nowPlaying, setNowPlaying] = useState<any>(null);
  const lastTrackId = useRef<string | null>(null);
  const nowPlayingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

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

        if (currentTrack) {
          // Si un morceau joue, on annule tout timer de suppression en cours
          if (nowPlayingTimeoutRef.current) {
            clearTimeout(nowPlayingTimeoutRef.current);
            nowPlayingTimeoutRef.current = null;
          }
          setNowPlaying(currentTrack);
        } else {
          // Si aucun morceau ne joue, on ne supprime pas immédiatement
          // On lance un délai de grâce de 60 secondes
          if (!nowPlayingTimeoutRef.current) {
            nowPlayingTimeoutRef.current = setTimeout(() => {
              setNowPlaying(null);
              nowPlayingTimeoutRef.current = null;
            }, 60000); // 60 secondes de délai
          }
        }
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
      if (nowPlayingTimeoutRef.current) clearTimeout(nowPlayingTimeoutRef.current);
    };
  }, []);

  // Fermer les popups de la navbar au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.bottom-nav')) {
        setShowPalette(false);
        setShowAccount(false);
        setShowFriends(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculateTrend = () => {
    if (!stats || !stats.previousMonthly) return null;
    const diff = ((stats.monthly - stats.previousMonthly) / stats.previousMonthly) * 100;
    return {
      value: Math.abs(diff).toFixed(0) + '%',
      isUp: diff > 0
    };
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats(false, period, trackPeriod, chartPeriod, artistLimit, trackLimit, false, period, trackPeriod);
    }, 300);

    return () => clearTimeout(timer);
  }, [period, trackPeriod, chartPeriod, artistLimit, trackLimit, fetchStats]);

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

  // Duplicate removed

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-dark)' }}>
        {themeColor && (
          <div className="logo-container" style={{ transform: 'scale(1.5)' }}>
            <div className="logo-wave" />
            <div className="logo-wave" />
            <div className="logo-wave" />
            <h1 style={{ 
              margin: 0, 
              fontWeight: 900, 
              letterSpacing: '-0.5px', 
              position: 'relative', 
              zIndex: 2,
              color: themeColor || undefined
            }}>Écho</h1>
          </div>
        )}
      </div>
    );
  }

  const hasData = stats && stats.weekly && stats.weekly.some(d => d.ms > 0);
  const weeklyTotalMs = stats?.weekly?.reduce((acc, curr) => acc + curr.ms, 0) || 0;

  return (
    <main className="dashboard animated">
      <header className="main-header">
        {/* --- DESKTOP HEADER (Original) --- */}
        <div className="desktop-only">
          <div className="header-top">
            <div className="logo-container">
              <div className="logo-wave" />
              <div className="logo-wave" />
              <div className="logo-wave" />
              <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.5px', color: themeColor || '#1DB954', position: 'relative', zIndex: 2 }}>Écho</h1>
            </div>
            
            {stats?.username && (
              <div className="header-controls">
                <div className="notif-wrapper" style={{ marginRight: '10px' }}>
                  <button 
                    className="notif-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNotifications();
                    }}
                  >
                    <Bell size={20} />
                    {notifications.some(n => !n.read) && <div className="notif-badge" />}
                  </button>
                  
                  
                </div>

                <div className="user-badge">
                  <div className="user-info">
                    <User size={14} />
                    <span>Connecté en tant que&nbsp;</span>
                    <strong>{stats.username}</strong>
                  </div>
                  <button className="logout-btn" onClick={handleLogout}><LogOut size={18} /></button>
                </div>
              </div>
            )}
          </div>
          
          <div className="header-controls">
            <div className="ambiance-selector" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Ambiance :</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                {PALETTES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setThemeColor(p.color)}
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
                  />
                ))}
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={() => fetchStats(true, period, trackPeriod, chartPeriod, artistLimit, trackLimit, false, period, trackPeriod)} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Synchronisation...' : 'Synchroniser'}</span>
              </button>
              <button className="btn btn-secondary" onClick={handleExport} disabled={syncing || !stats} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${themeColor || '#1DB954'}26`, color: themeColor || '#1DB954', border: `1px solid ${themeColor || '#1DB954'}4d` }}>
                <Share2 size={18} />
                <span>Partager</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- MOBILE HEADER (New centered) --- */}
        <div className="mobile-only">
          <div className="header-top" style={{ marginBottom: '40px', justifyContent: 'center' }}>
            <div className="logo-container" style={{ margin: 0 }}>
              <div className="logo-wave" />
              <div className="logo-wave" />
              <div className="logo-wave" />
              <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.5px', color: themeColor || '#1DB954', position: 'relative', zIndex: 2 }}>Écho</h1>
            </div>
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
        themeColor={themeColor || '#1DB954'}
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
              const diffMs = stats.today - stats.yesterday;
              const isPos = diffMs >= 0;
              return (
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  color: isPos ? '#1ed760' : '#ff4444',
                  background: isPos ? 'rgba(30, 215, 96, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {isPos ? '+' : '-'} {formatDiffTime(Math.abs(diffMs))}
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
              const diffMs = weeklyTotalMs - stats.prevWeekTotal;
              const isPos = diffMs >= 0;
              return (
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  color: isPos ? '#1ed760' : '#ff4444',
                  background: isPos ? 'rgba(30, 215, 96, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {isPos ? '+' : '-'} {formatDiffTime(Math.abs(diffMs))}
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

      <div className="chart-container animated" style={{ animationDelay: '0.4s', position: 'relative' }}>
        {loadingChart && (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'rgba(10,10,10,0.4)', 
            backdropFilter: 'blur(4px)', 
            zIndex: 10, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: '20px'
          }}>
            <RefreshCw className="animate-spin" style={{ color: 'var(--accent-green)' }} />
          </div>
        )}
        <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <BarChart3 color="var(--accent-green)" />
            <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              Activité {chartPeriod === 'week' ? 'Hebdomadaire' : chartPeriod === 'month' ? 'Mensuelle' : 'Annuelle'}
              <InfoTooltip text="Volume total d'écoute (en heures) cumulé sur la période sélectionnée." />
            </h3>
          </div>
          <div className="filter-row-mobile" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 1, width: '100%' }}>
            <div className="filter-bar-wrapper-mobile" style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                background: 'rgba(255,255,255,0.05)', 
                padding: '6px', 
                borderRadius: '24px', 
                border: '1px solid var(--glass-border)', 
                width: '100%',
                justifyContent: 'space-between'
              }}>
                {[ { id: 'week', label: 'Semaine' }, { id: 'month', label: 'Mois' }, { id: 'year', label: 'Année' } ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setChartPeriod(p.id as any)}
                    style={{
                      flex: 1,
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: chartPeriod === p.id ? `color-mix(in srgb, ${themeColor || '#1DB954'}, transparent 90%)` : 'transparent',
                      color: chartPeriod === p.id ? 'var(--accent-green)' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasData && stats?.chartData ? (
            <DashboardChart data={stats.chartData} color={themeColor || '#1DB954'} />
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
              <DashboardLineChart data={stats.hourlyActivity} color={themeColor || '#1DB954'} />
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
              <DashboardChart data={stats.dailyActivity} color={themeColor || '#1DB954'} />
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
            <div className="section-badge-container" style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowArtistLimit(!showArtistLimit)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
                  padding: '6px 20px',
                  borderRadius: '50px',
                  border: '1px solid color-mix(in srgb, var(--accent-green), transparent 80%)',
                  cursor: 'pointer',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-green), transparent 80%)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-green), transparent 90%)'}
              >
                <Music size={16} color="var(--accent-green)" />
                <h3 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Top {artistLimit} Artistes
                  <ChevronDown size={14} style={{ transform: showArtistLimit ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  <InfoTooltip text="Vos artistes les plus écoutés sur la période sélectionnée." />
                </h3>
              </button>

              {showArtistLimit && (
                <div className="custom-select-menu" style={{ top: '110%', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
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
              
              <div className="incomplete-badge-wrapper desktop-only-inline" style={{ marginLeft: '12px', display: 'inline-flex' }}>
                {(period === 'month' || period === 'year') && stats?.firstEntryDate && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#ffb91d', 
                    background: 'rgba(255, 185, 29, 0.1)', 
                    padding: '2px 10px', 
                    borderRadius: '12px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap'
                  }}>
                    (Période incomplète)
                  </span>
                )}
              </div>
            </div>

            <div className="filter-row-mobile" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 1 }}>
              <div className="filter-bar-wrapper-mobile" style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={{ 
                  display: 'flex', 
                  gap: '6px', 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '6px', 
                  borderRadius: '24px',
                  border: '1px solid var(--glass-border)',
                  minWidth: '200px',
                  justifyContent: 'space-between'
                }}>
                  {['week', 'month', 'year'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p as any)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: period === p ? `color-mix(in srgb, ${themeColor}, transparent 90%)` : 'transparent',
                        color: period === p ? 'var(--accent-green)' : 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
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
              maxHeight: stats.topArtists.length > 5 ? '400px' : 'none', 
              overflowY: stats.topArtists.length > 5 ? 'auto' : 'visible', 
              paddingRight: stats.topArtists.length > 5 ? '12px' : '0',
              opacity: syncing ? 0.6 : 1,
              transition: 'opacity 0.3s ease'
            }}
          >
            {stats.topArtists.slice(0, artistLimit).map((a, index) => {
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', gap: '15px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{a.artist}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatTime(a.total_ms)}
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

      {stats?.topTracks && stats.topTracks.length > 0 && (
        <div className="chart-container animated" style={{ animationDelay: '0.6s' }}>
          <div className="chart-header">
            {/* Rangée 1 : Badge Titre Centré (sur mobile) */}
            <div className="section-badge-container" style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowTrackLimit(!showTrackLimit)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
                  padding: '6px 20px',
                  borderRadius: '50px',
                  border: '1px solid color-mix(in srgb, var(--accent-green), transparent 80%)',
                  cursor: 'pointer',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-green), transparent 80%)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-green), transparent 90%)'}
              >
                <Clock size={16} color="var(--accent-green)" />
                <h3 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Top {trackLimit} Titres
                  <ChevronDown size={14} style={{ transform: showTrackLimit ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  <InfoTooltip text="Vos morceaux les plus écoutés sur la période sélectionnée." />
                </h3>
              </button>

              {showTrackLimit && (
                <div className="custom-select-menu" style={{ top: '110%', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
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

              <div className="incomplete-badge-wrapper desktop-only-inline" style={{ marginLeft: '12px', display: 'inline-flex' }}>
                {(trackPeriod === 'month' || trackPeriod === 'year') && stats?.firstEntryDate && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#ffb91d', 
                    background: 'rgba(255, 185, 29, 0.1)', 
                    padding: '2px 10px', 
                    borderRadius: '12px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap'
                  }}>
                    (Période incomplète)
                  </span>
                )}
              </div>
            </div>

            <div className="filter-row-mobile" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 1 }}>
              <div className="filter-bar-wrapper-mobile" style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={{ 
                  display: 'flex', 
                  gap: '6px', 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '6px', 
                  borderRadius: '24px',
                  border: '1px solid var(--glass-border)',
                  minWidth: '200px',
                  justifyContent: 'space-between'
                }}>
                  {['week', 'month', 'year'].map(p => (
                    <button
                      key={p}
                      onClick={() => setTrackPeriod(p as any)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: trackPeriod === p ? `color-mix(in srgb, ${themeColor}, transparent 90%)` : 'transparent',
                        color: trackPeriod === p ? 'var(--accent-green)' : 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
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
              maxHeight: stats.topTracks.length > 5 ? '400px' : 'none', 
              overflowY: stats.topTracks.length > 5 ? 'auto' : 'visible', 
              paddingRight: stats.topTracks.length > 5 ? '12px' : '0',
              opacity: syncing ? 0.6 : 1,
              transition: 'opacity 0.3s ease'
            }}
          >
            {stats.topTracks.slice(0, trackLimit).map((t, index) => {
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
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.95rem', gap: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.artist}</span>
                      </div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
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

      {/* Floating Action Buttons */}
      <div className="floating-actions">
        <button 
          className="fab fab-share" 
          onClick={handleExport}
          disabled={syncing || !stats}
          title="Partager"
        >
          <Share2 size={22} />
        </button>
        <div className="fab-sync-wrapper">
          {manualSyncing && <span className="sync-label">Synchronisation...</span>}
          <button 
            className="fab fab-sync" 
            onClick={() => fetchStats(true, period, trackPeriod, chartPeriod, artistLimit, trackLimit, true, period, trackPeriod)} 
            disabled={syncing}
            title="Synchroniser"
          >
            <RefreshCw size={22} className={syncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav">
        <div 
          className={`nav-item ${activeTab === 'accueil' ? 'active' : ''}`}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setActiveTab('accueil');
          }}
        >
          <div className="icon-wrapper">
            <Music size={24} />
          </div>
          <span>Accueil</span>
        </div>

        <div 
          className={`nav-item ${showPalette ? 'active' : ''}`}
          onClick={() => {
            setShowPalette(!showPalette);
            setShowAccount(false);
            setShowFriends(false);
          }}
        >
          <div className="icon-wrapper">
            <Palette size={24} />
          </div>
          <span>Thème</span>
        </div>

        <button className={`nav-item ${showFriends ? 'active' : ''}`} onClick={() => { setShowFriends(true); setActiveTab('amis'); setShowPalette(false); setShowAccount(false); setShowNotifications(false); }}>
          <Users size={24} color={showFriends ? 'var(--accent-green)' : 'var(--text-secondary)'} />
          <span>Amis</span>
        </button>

        <button className={`nav-item ${showNotifications ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleNotifications(); setShowPalette(false); setShowFriends(false); setShowAccount(false); }}>
          <div style={{ position: 'relative' }}>
            <Bell size={24} color={showNotifications ? 'var(--accent-green)' : 'var(--text-secondary)'} />
            {notifications.some(n => !n.read) && <div className="notif-badge" style={{ top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'red', borderRadius: '50%', position: 'absolute' }} />}
          </div>
          <span>Notifications</span>
        </button>

        <div 
          className={`nav-item ${showAccount ? 'active' : ''}`}
          onClick={() => {
            setShowAccount(!showAccount);
            setShowPalette(false);
            setShowFriends(false);
          }}
        >
          <div className="icon-wrapper">
            <User size={24} />
          </div>
          <span>Compte</span>
        </div>

        {/* Floating Centered Popups */}
        {showPalette && (
          <div className="palette-popup" onClick={(e) => e.stopPropagation()}>
            {PALETTES.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setThemeColor(p.color);
                  setShowPalette(false);
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: p.color,
                  border: themeColor === p.color ? '2px solid white' : 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
              />
            ))}
          </div>
        )}

        {showFriends && (
          <div className="palette-popup" style={{ gap: '10px', padding: '15px 25px' }} onClick={(e) => e.stopPropagation()}>
            <Clock size={20} className="animate-pulse" style={{ color: 'var(--accent-green)' }} />
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Coming soon...</span>
          </div>
        )}

        {showAccount && stats?.username && (
          <div className="palette-popup" style={{ flexDirection: 'column', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>@{stats.username}</div>
            <button 
              onClick={handleLogout}
              style={{ 
                background: 'rgba(255, 68, 68, 0.1)', 
                color: '#ff4444', 
                border: '1px solid rgba(255, 68, 68, 0.2)', 
                padding: '10px 20px', 
                borderRadius: '12px', 
                fontSize: '0.85rem',
                fontWeight: 700,
                width: '100%',
                cursor: 'pointer'
              }}
            >
              Déconnexion
            </button>
          </div>
        )}
      </nav>

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
        @media (hover: hover) {
          .custom-select-item:hover {
            background: rgba(255,255,255,0.1);
            color: white;
          }
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

          /* Note: Mobile layout is handled in globals.css for better maintainability */
      `}</style>
      {showNotifications && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h4 style={{ margin: 0 }}>Notifications</h4>
            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{notifications.length} message(s)</span>
          </div>
          {notifications.map(n => (
            <div key={n.id} className={`notif-item ${!n.read ? 'new' : ''}`}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{n.title}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '4px' }}>{n.message}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>{n.date}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
