'use client';

import { X, Music, User, TrendingUp, Clock, Award, ChevronDown, Activity, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatTime } from '@/lib/utils';
import BadgesSection from '@/components/BadgesSection';
import UserAvatar from '@/components/UserAvatar';

interface FriendStats {
  username: string;
  topArtists: { artist: string; total_ms: number; image_url: string | null }[];
  topTracks: { title: string; artist: string; play_count: number; image_url: string | null }[];
  badges: any[];
  nowPlaying?: {
    name: string;
    artist: string;
    image: string;
  };
  extraStats?: {
    yearHours: number;
    weekHours: number;
    favoriteDay: number;
    favoriteHour: number;
  };
  commonArtists: { artist: string; image_url: string | null }[];
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const formatHoursToHMin = (decimalHours: number) => {
  if (!decimalHours) return '0h00';
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
};

interface FriendProfileModalProps {
  friendId: string;
  onClose: () => void;
  themeColor: string;
}

export default function FriendProfileModal({ friendId, onClose, themeColor }: FriendProfileModalProps) {
  const [stats, setStats] = useState<FriendStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<string>('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/friends/${friendId}/stats`);
        const data = await res.json();
        if (data.username) {
          setStats(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [friendId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Récupération des goûts de ton ami...</p>
          </div>
        ) : stats ? (
          <>
            <div className="profile-header">
              <UserAvatar 
                username={stats.username} 
                badges={stats.badges} 
                themeColor={themeColor} 
                size={80} 
              />
              <div>
                <h2 style={{ margin: 0 }}>@{stats.username}</h2>
                <p style={{ opacity: 0.5, margin: 0, fontSize: '0.9rem' }}>Profil Écho</p>
              </div>
            </div>

            {/* Live Indicator */}
            {stats.nowPlaying && (
              <div className="live-container" style={{ 
                margin: '0 0 20px 0', 
                background: `${themeColor}1a`, 
                border: `1px solid ${themeColor}4d`,
                padding: '12px 16px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'fadeInUp 0.5s ease-out'
              }}>
                <div className="live-dot-container" style={{ position: 'relative', width: '12px', height: '12px' }}>
                  <div className="live-dot" style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: themeColor, 
                    borderRadius: '50%' 
                  }} />
                  <div className="live-pulse" style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: themeColor,
                    borderRadius: '50%',
                    animation: 'pulse-theme 2s infinite'
                  }} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: themeColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    En direct
                  </p>
                  <a 
                    href={`https://open.spotify.com/search/${encodeURIComponent(stats.nowPlaying.name + ' ' + stats.nowPlaying.artist)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'block',
                      margin: '2px 0 0 0', 
                      fontSize: '0.95rem', 
                      color: 'white', 
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                    className="hover-underline"
                  >
                    {stats.nowPlaying.name} — {stats.nowPlaying.artist}
                  </a>
                </div>
                
                {stats.nowPlaying.image && (
                  <img 
                    src={stats.nowPlaying.image} 
                    alt="" 
                    style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
                  />
                )}
              </div>
            )}

            <div className="accordion-container">
              {/* Accordion: Statistiques Globales */}
              {stats.extraStats && (
                <div className={`accordion-item ${openSection === 'stats' ? 'open' : ''}`}>
                  <button className="accordion-header" onClick={() => setOpenSection(openSection === 'stats' ? '' : 'stats')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Activity size={20} color={openSection === 'stats' ? 'var(--accent-green)' : 'white'} />
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Statistiques Globales</h3>
                    </div>
                    <ChevronDown size={20} className="accordion-icon" />
                  </button>
                  <div className="accordion-content">
                    <div style={{ padding: '0 20px 20px 20px' }}>
                      <div className="global-stats-grid">
                        <div className="stat-box">
                          <span className="stat-label">Durée d'écoute totale</span>
                          <span className="stat-value">{formatHoursToHMin(stats.extraStats.yearHours)}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Durée d'écoute cette semaine</span>
                          <span className="stat-value">{formatHoursToHMin(stats.extraStats.weekHours)}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Jour Préféré</span>
                          <span className="stat-value">{DAYS_OF_WEEK[stats.extraStats.favoriteDay - 1] || 'N/A'}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Heure de Pointe</span>
                          <span className="stat-value">{stats.extraStats.favoriteHour}h - {(stats.extraStats.favoriteHour + 1) % 24}h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Accordion: Artistes en Commun */}
              <div className={`accordion-item ${openSection === 'common' ? 'open' : ''}`}>
                <button className="accordion-header" onClick={() => setOpenSection(openSection === 'common' ? '' : 'common')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={20} color={openSection === 'common' ? 'var(--accent-green)' : 'white'} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Artistes en Commun <span className="month-tag">{stats.commonArtists.length}</span></h3>
                  </div>
                  <ChevronDown size={20} className="accordion-icon" />
                </button>
                <div className="accordion-content">
                  <div style={{ padding: '0 20px 20px 20px' }}>
                    {stats.commonArtists.length > 0 ? (
                      <div className="stats-list">
                        {stats.commonArtists.map((a, i) => (
                          <div key={i} className="stat-item">
                            {a.image_url ? <img src={a.image_url} alt="" /> : <div className="placeholder-img"><User size={16} /></div>}
                            <div className="stat-info">
                              <div className="stat-name">{a.artist}</div>
                              <div className="stat-sub">Vous écoutez tous les deux cet artiste</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5, fontSize: '0.9rem' }}>
                        Aucun artiste en commun dans vos Top 50 respectifs.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Accordion: Top 5 Sons */}
              <div className={`accordion-item ${openSection === 'tracks' ? 'open' : ''}`}>
                <button className="accordion-header" onClick={() => setOpenSection(openSection === 'tracks' ? '' : 'tracks')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Music size={20} color={openSection === 'tracks' ? 'var(--accent-green)' : 'white'} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Top 5 Sons <span className="month-tag">du mois</span></h3>
                  </div>
                  <ChevronDown size={20} className="accordion-icon" />
                </button>
                <div className="accordion-content">
                  <div style={{ padding: '0 20px 20px 20px' }}>
                    <div className="stats-list">
                      {stats.topTracks.map((t, i) => (
                        <div key={i} className="stat-item">
                          <span className="stat-rank">{i + 1}</span>
                          {t.image_url ? <img src={t.image_url} alt="" /> : <div className="placeholder-img"><Music size={16} /></div>}
                          <div className="stat-info">
                            <div className="stat-name">{t.title}</div>
                            <div className="stat-sub">{t.artist} • {t.play_count} écoutes</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Accordion: Top 5 Artistes */}
              <div className={`accordion-item ${openSection === 'artists' ? 'open' : ''}`}>
                <button className="accordion-header" onClick={() => setOpenSection(openSection === 'artists' ? '' : 'artists')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp size={20} color={openSection === 'artists' ? 'var(--accent-green)' : 'white'} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Top 5 Artistes <span className="month-tag">du mois</span></h3>
                  </div>
                  <ChevronDown size={20} className="accordion-icon" />
                </button>
                <div className="accordion-content">
                  <div style={{ padding: '0 20px 20px 20px' }}>
                    <div className="stats-list">
                      {stats.topArtists.map((a, i) => (
                        <div key={i} className="stat-item">
                          <span className="stat-rank">{i + 1}</span>
                          {a.image_url ? <img src={a.image_url} alt="" /> : <div className="placeholder-img"><User size={16} /></div>}
                          <div className="stat-info">
                            <div className="stat-name">{a.artist}</div>
                            <div className="stat-sub">{formatTime(a.total_ms)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Accordion: Succès */}
              <div className={`accordion-item ${openSection === 'succes' ? 'open' : ''}`}>
                <button className="accordion-header" onClick={() => setOpenSection(openSection === 'succes' ? '' : 'succes')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Award size={20} color={openSection === 'succes' ? 'var(--accent-green)' : 'white'} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Badges de Succès</h3>
                  </div>
                  <ChevronDown size={20} className="accordion-icon" />
                </button>
                <div className="accordion-content">
                  <div style={{ padding: '0 20px 20px 20px' }}>
                    <BadgesSection badges={stats.badges} hideTitle={true} />
                  </div>
                </div>
              </div>
            </div>
            {/* Spacer to avoid clipping at the bottom */}
            <div style={{ height: '40px' }} />
          </>
        ) : (
          <div className="error-state">Erreur lors du chargement.</div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content {
          background: #111;
          border: 1px solid var(--glass-border);
          border-radius: 30px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          padding: 40px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }
        .close-btn {
          position: absolute;
          top: 25px;
          right: 25px;
          background: rgba(255,255,255,0.05);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .close-btn:hover { background: rgba(255,255,255,0.1); transform: rotate(90deg); }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 25px;
          margin-bottom: 40px;
          padding-bottom: 25px;
          border-bottom: 1px solid var(--glass-border);
        }

        @keyframes pulse-theme {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }

        .hover-underline:hover {
          text-decoration: underline !important;
        }

        .accordion-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .accordion-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .accordion-item.open {
          background: rgba(255, 255, 255, 0.04);
          border-color: color-mix(in srgb, var(--accent-green), transparent 80%);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .accordion-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          font-family: inherit;
        }
        .accordion-icon {
          transition: transform 0.3s ease;
          opacity: 0.5;
        }
        .accordion-item.open .accordion-icon {
          transform: rotate(180deg);
          color: var(--accent-green);
          opacity: 1;
        }
        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
          opacity: 0;
        }
        .accordion-item.open .accordion-content {
          max-height: 1000px; /* Grande valeur pour permettre l'expansion */
          opacity: 1;
        }

        .month-tag {
          font-size: 0.7rem;
          background: rgba(255,255,255,0.05);
          padding: 2px 8px;
          border-radius: 4px;
          opacity: 0.6;
          margin-left: 5px;
          font-weight: normal;
        }

        .stats-list { display: flex; flex-direction: column; gap: 10px; }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 15px;
          background: rgba(255,255,255,0.03);
          padding: 10px;
          border-radius: 14px;
          transition: background 0.2s;
        }
        .stat-item:hover { background: rgba(255,255,255,0.06); }
        .stat-rank { font-weight: 900; opacity: 0.2; font-size: 1.2rem; width: 20px; text-align: center; }
        .stat-item img { width: 45px; height: 45px; border-radius: 8px; object-fit: cover; }
        .placeholder-img { 
          width: 45px; height: 45px; background: #222; border-radius: 8px; 
          display: flex; align-items: center; justify-content: center; opacity: 0.3;
        }
        .stat-name { font-weight: 700; font-size: 0.95rem; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-sub { font-size: 0.8rem; opacity: 0.5; }

        .global-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .stat-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .stat-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 5px;
          font-weight: 700;
          line-height: 1.2;
        }

        .stat-value {
          font-size: 1.2rem;
          font-weight: 900;
          color: var(--accent-green);
        }

        .loading-state { text-align: center; padding: 60px 0; }
        .spinner {
          width: 40px; height: 40px; border: 4px solid color-mix(in srgb, var(--accent-green), transparent 90%);
          border-top-color: var(--accent-green); border-radius: 50%;
          margin: 0 auto 20px; animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .modal-content {
            padding: 20px;
            border-radius: 20px;
          }
          .profile-header {
            margin-bottom: 25px;
            gap: 15px;
          }
          .profile-avatar {
            width: 60px;
            height: 60px;
          }
          .profile-avatar :global(svg) {
            width: 30px;
            height: 30px;
          }
          .accordion-header {
            padding: 15px;
          }
          .accordion-header h3 {
            font-size: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
