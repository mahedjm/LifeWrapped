'use client';

import { forwardRef } from 'react';
import { Music, Clock, Zap } from 'lucide-react';

interface ShareCardProps {
  stats: {
    topArtists: { artist: string; total_ms: number; image_url: string | null }[];
    weeklyTotalMs: number;
    obsession?: { title: string; artist: string; image_url: string; play_count: number } | null;
  } | null;
  themeColor?: string;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ stats, themeColor = '#1db954' }, ref) => {
  if (!stats) return null;

  const formatTime = (ms: number) => {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  return (
    <div 
      ref={ref}
      style={{
        width: '400px',
        height: '710px',
        background: '#0a0a0a',
        color: 'white',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: '-10000px', // Caché de la vue principale
        top: 0,
        fontFamily: "'Inter', system-ui, sans-serif",
        borderRadius: '0', // Pour la capture, on veut des bords propres
        '--accent-green': themeColor
      } as React.CSSProperties}
    >
      {/* Background Decor */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '300px',
        height: '300px',
        background: `radial-gradient(circle, ${themeColor}33 0%, transparent 70%)`,
        filter: 'blur(40px)',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-10%',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
        filter: 'blur(40px)',
        zIndex: 0
      }}></div>

      <div style={{ zIndex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{ background: 'var(--accent-green)', padding: '6px', borderRadius: '8px' }}>
            <Zap size={20} color="black" />
          </div>
          <h1 style={{ fontSize: '1.2rem', margin: 0, letterSpacing: '-0.5px', fontWeight: 900, color: '#fff', background: 'none' }}>
            Life<span style={{ color: 'var(--accent-green)' }}>Wrapped</span>
          </h1>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <p style={{ color: 'var(--accent-green)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px', fontSize: '0.7rem', margin: '0 0 5px 0' }}>Récapitulatif</p>
          <h2 style={{ fontSize: '2.2rem', margin: 0, fontWeight: 900, lineHeight: 1.1 }}>Ma Semaine en Musique</h2>
        </div>

        {/* Top Artists */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Top Artistes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {stats.topArtists.slice(0, 5).map((artist, i) => (
              <div key={artist.artist} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
                  {artist.image_url ? (
                    <img src={artist.image_url} alt={artist.artist} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Music size={16} />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{artist.artist}</span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>#{i + 1} • {Math.round(artist.total_ms / 60000)} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Time Card */}
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '20px', 
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
            <Clock size={20} color="var(--accent-green)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>TEMPS TOTAL</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{formatTime(stats.weeklyTotalMs)}</div>
          </div>
        </div>

        {/* Obsession Fallback or Display */}
        {stats.obsession ? (
          <div style={{ marginTop: 'auto', background: `linear-gradient(90deg, ${themeColor}33, transparent)`, padding: '15px', borderRadius: '12px', borderLeft: `4px solid ${themeColor}` }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: themeColor, textTransform: 'uppercase', marginBottom: '5px' }}>Obsession du moment</div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{stats.obsession.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{stats.obsession.artist}</div>
          </div>
        ) : (
          <div style={{ marginTop: 'auto', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', paddingBottom: '10px' }}>
            Généré avec LifeWrapped.com
          </div>
        )}

        <div style={{ 
          textAlign: 'center', 
          marginTop: stats.obsession ? '20px' : '0', 
          paddingTop: '20px', 
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.3)',
          fontWeight: 600
        }}>
          #myLifeWrapped
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';

export default ShareCard;
