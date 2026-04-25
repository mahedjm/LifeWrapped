'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, Clock, Calendar, BarChart3, RefreshCw, 
  AlertCircle, Music, ChevronDown, PieChart, HelpCircle, 
  Share2, LogOut, User, Palette, Users, Bell, 
  Search, TrendingUp, Award, Grid, Zap, Info, Layers, X
} from 'lucide-react';
import HomeTab from '@/components/tabs/HomeTab';
import ClubTab from '@/components/tabs/ClubTab';
import FriendsTab from '@/components/tabs/FriendsTab';
import AchievementsTab from '@/components/tabs/AchievementsTab';
import NowPlaying from '@/components/NowPlaying';
import FriendProfileModal from '@/components/FriendProfileModal';
import FloatingActions from '@/components/FloatingActions';
import ShareCard from '@/components/ShareCard';



const LOADING_PHRASES = [
  "On demande l'avis de tes voisins sur tes goûts musicaux...",
  "Nettoyage des scrobbles gênants de 2012...",
  "On vérifie si tu as vraiment écouté ça ou si c'est une erreur...",
  "Accordage des ondes sonores...",
  "Récupération de ton obsession du moment (pas de jugement)...",
  "Chargement de tes stats (prépare-toi psychologiquement)...",
  "On essaie de comprendre pourquoi tu écoutes encore ce titre...",
  "Analyse de tes habitudes (spoiler: c'est brillant)...",
  "Synchronisation avec ton âme musicale..."
];

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
  const [activeTab, setActiveTab] = useState<'accueil' | 'amis' | 'club' | 'succes'>('accueil');
  const [showPalette, setShowPalette] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [friendsRefreshKey, setFriendsRefreshKey] = useState(0);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [showPhrases, setShowPhrases] = useState(false);
  
  // Custom Hooks (Logic extraction)
  const { themeColor, setThemeColor } = useTheme();
  const { 
    stats, setStats, loading, syncing, setSyncing, manualSyncing, 
    loadingChart, setLoadingChart, error, fetchStats 
  } = useStats(period, trackPeriod, chartPeriod, artistLimit, trackLimit);
  const { 
    showNotifications, setShowNotifications, notifications, toggleNotifications, removeNotification, respondToFriendRequest 
  } = useNotifications();

  // Navigation & UI references
  const [nowPlaying, setNowPlaying] = useState<any>(null);
  const lastTrackId = useRef<string | null>(null);
  const nowPlayingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const lastFetchDateRef = useRef<string>(new Date().toLocaleDateString());

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

    const handleFocus = () => {
      const today = new Date().toLocaleDateString();
      if (lastFetchDateRef.current !== today) {
        console.log('New day detected on focus, forcing refresh...');
        fetchStats(true, period, trackPeriod, chartPeriod, artistLimit, trackLimit, false, period, trackPeriod, true);
        lastFetchDateRef.current = today;
      }
      checkNowPlaying();
    };

    checkNowPlaying();
    const interval = setInterval(checkNowPlaying, 4000); // 4 secondes pour une réactivité optimale

    // Vérification immédiate quand vous revenez sur l'onglet
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (nowPlayingTimeoutRef.current) clearTimeout(nowPlayingTimeoutRef.current);
    };
  }, []);

  // Fermer les popups de la navbar au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.bottom-nav') && !target.closest('.floating-actions-container')) {
        setShowPalette(false);
        setShowAccount(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (loading) {
      // Retard d'apparition pour la première phrase
      const delayTimer = setTimeout(() => setShowPhrases(true), 1500);

      // On commence par une phrase au hasard
      setLoadingPhraseIndex(Math.floor(Math.random() * LOADING_PHRASES.length));
      
      const interval = setInterval(() => {
        setLoadingPhraseIndex(prev => (prev + 1) % LOADING_PHRASES.length);
      }, 3500);
      
      return () => {
        clearInterval(interval);
        clearTimeout(delayTimer);
        setShowPhrases(false);
      };
    }
  }, [loading]);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

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

  const handleRespondToFriendRequest = async (id: number, action: 'accept' | 'decline') => {
    const success = await respondToFriendRequest(id, action);
    if (success && action === 'accept') {
      setFriendsRefreshKey(prev => prev + 1);
    }
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
      link.download = `Echo_Stats_${new Date().toISOString().split('T')[0]}.png`;
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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: 'var(--bg-dark)',
        gap: '130px',
        padding: '20px'
      }}>
        {themeColor && (
          <div className="logo-container rainbow" style={{ transform: 'scale(1.6)' }}>
            <div className="logo-wave" />
            <div className="logo-wave" />
            <div className="logo-wave" />
            <h1 style={{ 
              margin: 0, 
              fontWeight: 900, 
              letterSpacing: '-0.5px', 
              position: 'relative', 
              zIndex: 2,
              color: 'var(--accent-green)'
            }}>Écho</h1>
          </div>
        )}
        {showPhrases && (
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '0.95rem', 
            textAlign: 'center',
            maxWidth: '300px',
            lineHeight: '1.5',
            minHeight: '3em',
            animation: 'loadingTextFade 3.5s ease-in-out'
          }} key={loadingPhraseIndex}>
            {LOADING_PHRASES[loadingPhraseIndex]}
          </p>
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
            <div className="logo-container" onClick={() => { setActiveTab('accueil'); setShowPalette(false); setShowNotifications(false); }} style={{ cursor: 'pointer' }}>
              <div className="logo-wave" />
              <div className="logo-wave" />
              <div className="logo-wave" />
              <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--accent-green)', position: 'relative', zIndex: 2 }}>Écho</h1>
            </div>

            <nav className="desktop-nav">
              <button className={activeTab === 'accueil' ? 'active' : ''} onClick={() => { setActiveTab('accueil'); setShowPalette(false); setShowNotifications(false); }}>
                <Music size={18} /> Accueil
              </button>
              <button className={activeTab === 'club' ? 'active' : ''} onClick={() => { setActiveTab('club'); setShowPalette(false); setShowNotifications(false); }}>
                <Zap size={18} /> Club
              </button>
              <button className={activeTab === 'amis' ? 'active' : ''} onClick={() => { setActiveTab('amis'); setShowPalette(false); setShowNotifications(false); }}>
                <Users size={18} /> Amis
              </button>
              <button className={activeTab === 'succes' ? 'active' : ''} onClick={() => { setActiveTab('succes'); setShowPalette(false); setShowNotifications(false); }}>
                <Award size={18} /> Succès
              </button>
            </nav>
            
            {stats?.username && (
              <div className="header-controls">
                <div className="user-badge">
                  <div className="user-info">
                    <User size={14} />
                    <span>Connecté en tant que&nbsp;</span>
                    <strong>{stats.username}</strong>
                  </div>
                  <button className="logout-btn" onClick={handleLogout}><LogOut size={18} /></button>
                </div>

                <div className="notif-wrapper" style={{ marginLeft: '10px' }}>
                  <button 
                    className="notif-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNotifications();
                    }}
                  >
                    <Bell size={20} />
                    {notifications.some(n => n.status === 'unread') && <div className="notif-badge" />}
                  </button>
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
          <div className="header-top" style={{ marginBottom: '40px', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <div className="logo-container" style={{ margin: 0 }}>
              <div className="logo-wave" />
              <div className="logo-wave" />
              <div className="logo-wave" />
              <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--accent-green)', position: 'relative', zIndex: 2 }}>Écho</h1>
            </div>

            {/* Notifications sur mobile (déplacées en haut à droite) */}
            {stats?.username && (
              <div style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', zIndex: 100 }}>
                <button 
                  className="notif-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNotifications();
                    setShowAccount(false);
                    setShowPalette(false);
                  }}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid var(--glass-border)', 
                    color: 'white', 
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                  }}
                >
                  <Bell size={28} />
                  {notifications.some(n => n.status === 'unread') && <div className="notif-badge" style={{ top: '-4px', right: '-4px', width: '10px', height: '10px' }} />}
                </button>
              </div>
            )}
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

      {activeTab === 'amis' ? (
        <FriendsTab setSelectedFriendId={setSelectedFriendId} friendsRefreshKey={friendsRefreshKey} />
      ) : activeTab === 'club' ? (
        <ClubTab setSelectedFriendId={setSelectedFriendId} />
      ) : activeTab === 'succes' ? (
        <AchievementsTab badges={stats?.badges} />
      ) : (
        <HomeTab 
          stats={stats} period={period} setPeriod={setPeriod}
          trackPeriod={trackPeriod} setTrackPeriod={setTrackPeriod}
          chartPeriod={chartPeriod} setChartPeriod={setChartPeriod}
          artistLimit={artistLimit} setArtistLimit={setArtistLimit}
          trackLimit={trackLimit} setTrackLimit={setTrackLimit}
          showArtistLimit={showArtistLimit} setShowArtistLimit={setShowArtistLimit}
          showTrackLimit={showTrackLimit} setShowTrackLimit={setShowTrackLimit}
          themeColor={themeColor || '#1DB954'} loadingChart={loadingChart} syncing={syncing}
        />
      )}

      {/* Boutons Flottants (Mobile) - Centralisés dans un composant pour plus de clarté */}
      <FloatingActions 
        themeColor={themeColor || '#1DB954'}
        setThemeColor={setThemeColor}
        showPalette={showPalette}
        setShowPalette={setShowPalette}
        handleExport={handleExport}
        fetchStats={(manual) => fetchStats(manual, period, trackPeriod, chartPeriod, artistLimit, trackLimit, true, period, trackPeriod)}
        syncing={syncing}
        manualSyncing={manualSyncing}
        hasStats={!!stats}
        activeTab={activeTab}
        onActionStart={() => {
          setShowAccount(false);
          setShowNotifications(false);
        }}
      />

      <nav className="bottom-nav">
        <div 
          className={`nav-item ${activeTab === 'accueil' ? 'active' : ''}`}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setActiveTab('accueil');
            setShowPalette(false);
            setShowAccount(false);
            setShowNotifications(false);
          }}
        >
          <div className="icon-wrapper">
            <Music size={24} />
          </div>
          <span>Accueil</span>
        </div>

        <button className={`nav-item ${activeTab === 'amis' ? 'active' : ''}`} onClick={() => { setActiveTab('amis'); setShowPalette(false); setShowAccount(false); setShowNotifications(false); }}>
          <div style={{ position: 'relative' }}>
            <Users size={24} color={activeTab === 'amis' ? 'var(--accent-green)' : 'var(--text-secondary)'} />
            {notifications.some(n => n.type === 'friend_request') && (
              <div style={{ 
                position: 'absolute', 
                top: '-2px', 
                right: '-2px', 
                width: '8px', 
                height: '8px', 
                background: '#ff4444', 
                borderRadius: '50%',
                border: '2px solid var(--bg-dark)'
              }} />
            )}
          </div>
          <span>Amis</span>
        </button>

        <div 
          className={`nav-item ${activeTab === 'club' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('club');
            setShowPalette(false);
            setShowAccount(false);
            setShowNotifications(false);
          }}
        >
          <div className="icon-wrapper">
            <Zap size={24} color={activeTab === 'club' ? 'var(--accent-green)' : 'var(--text-secondary)'} />
          </div>
          <span>Club</span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'succes' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('succes');
            setShowPalette(false);
            setShowAccount(false);
            setShowNotifications(false);
          }}
        >
          <div className="icon-wrapper">
            <Award size={24} color={activeTab === 'succes' ? 'var(--accent-green)' : 'var(--text-secondary)'} />
          </div>
          <span>Succès</span>
        </div>

        <div 
          className={`nav-item ${showAccount ? 'active' : ''}`}
          onClick={() => {
            setShowAccount(!showAccount);
            setShowPalette(false);
            setShowNotifications(false);
          }}
        >
          <div className="icon-wrapper">
            <User size={24} />
          </div>
          <span>Compte</span>
        </div>

        {/* Floating Centered Popups */}
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
          {notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
              Aucune notification
            </div>
          ) : notifications.map(n => (
            <div key={n.id} className={`notif-item ${n.status === 'unread' ? 'new' : ''}`} style={{ position: 'relative' }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(n.id);
                }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#ff4444',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
              >
                <X size={14} />
              </button>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px', paddingRight: '20px' }}>{n.title}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '4px', paddingRight: '20px', lineHeight: '1.4' }}>{n.message}</div>
              
              {n.type === 'friend_request' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', marginBottom: '8px' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRespondToFriendRequest(n.id, 'accept'); }}
                    style={{ 
                      background: 'var(--accent-green)', 
                      color: 'black', 
                      border: 'none', 
                      borderRadius: '8px', 
                      padding: '6px 12px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: 'pointer' 
                    }}
                  >
                    Accepter
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRespondToFriendRequest(n.id, 'decline'); }}
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      color: 'white', 
                      border: '1px solid var(--glass-border)', 
                      borderRadius: '8px', 
                      padding: '6px 12px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: 'pointer' 
                    }}
                  >
                    Refuser
                  </button>
                </div>
              )}
              
            </div>
          ))}
        </div>
      )}
      {/* Composant caché pour l'export d'image */}
      {stats && (
        <div style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -1 }}>
          <ShareCard ref={shareCardRef} stats={stats} themeColor={themeColor} />
        </div>
      )}

      {selectedFriendId && (
        <FriendProfileModal 
          friendId={selectedFriendId} 
          onClose={() => setSelectedFriendId(null)} 
        />
      )}
      <footer className="footer-credits">
        <div className="footer-divider" />
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-name">Écho</span>
            <span className="brand-dot">•</span>
            <span className="brand-desc">Ton univers musical</span>
          </div>
          <div className="footer-links">
            <a href="/privacy" className="footer-link">Confidentialité</a>
            <span className="footer-link-dot">•</span>
            <div className="lastfm-credit">
              <span>Powered by</span>
              <a href="https://www.last.fm" target="_blank" rel="noopener noreferrer" className="lastfm-link">
                <img src="https://www.last.fm/static/images/footer_logo@2x.49ca51948b0a.png" alt="Last.fm" className="lastfm-logo" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
