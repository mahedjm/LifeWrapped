'use client';

import { forwardRef } from 'react';
import { Music, Clock, Zap } from 'lucide-react';

import { Stats } from '@/lib/types';

interface ShareCardProps {
  stats: Stats | null;
  themeColor?: string | null;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ stats, themeColor }, ref) => {
  if (!stats) return null;

  const effectiveColor = themeColor || '#1db954';

  const formatTime = (ms: number | undefined) => {
    if (ms === undefined || isNaN(ms)) return "0h 00min";
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}min`;
  };

  // Calcul du total de la semaine si non fourni
  const weeklyTotalMs = stats.weekly?.reduce((acc, day) => acc + (day.ms || 0), 0) || 0;

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
        '--accent-green': effectiveColor
      } as React.CSSProperties}
    >
      {/* Background Decor */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '300px',
        height: '300px',
        background: `radial-gradient(circle, ${effectiveColor}33 0%, transparent 70%)`,
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
        {/* Header - Logo Écho avec ondes fixes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* Ondes fixes pour la capture */}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '60px', height: '60px', borderRadius: '50%', border: `1px solid ${effectiveColor}`, opacity: 0.15 }} />
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '80px', height: '80px', borderRadius: '50%', border: `1px solid ${effectiveColor}`, opacity: 0.1 }} />
            
            <h1 style={{ 
              fontSize: '1.5rem', 
              margin: 0, 
              fontWeight: 900, 
              letterSpacing: '-1px', 
              color: effectiveColor,
              position: 'relative',
              zIndex: 2
            }}>
              Écho
            </h1>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <p style={{ color: effectiveColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px', fontSize: '0.7rem', margin: '0 0 5px 0' }}>Récapitulatif</p>
          <h2 style={{ fontSize: '2.2rem', margin: 0, fontWeight: 900, lineHeight: 1.1 }}>Ma Semaine en Musique</h2>
        </div>

        {/* Top Artists */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Top Artistes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {stats.topArtists.slice(0, 5).map((artist, i) => (
              <div key={artist.artist} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${effectiveColor}33` }}>
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
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>#{i + 1} • {formatTime(artist.total_ms)}</span>
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
            <Clock size={20} color={effectiveColor} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>TEMPS TOTAL D'ÉCOUTE</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{formatTime(weeklyTotalMs)}</div>
          </div>
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: 'auto', 
          paddingTop: '20px', 
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.3)',
          fontWeight: 600
        }}>
          #monEcho
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';

export default ShareCard;
