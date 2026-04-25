'use client';

import { useState, useEffect } from 'react';
import { Radio, Users, Sparkles, TrendingUp, Music } from 'lucide-react';

interface CollectiveArtist {
  name: string;
  total_scrobbles: number;
  listener_count: number;
  image_url: string | null;
}

export default function ClubAntenna() {
  const [artists, setArtists] = useState<CollectiveArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubStats = async () => {
      try {
        const res = await fetch('/api/club/stats');
        const data = await res.json();
        if (data.topArtists) {
          setArtists(data.topArtists);
        }
      } catch (err) {
        console.error('Failed to fetch club stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClubStats();
  }, []);

  if (loading) {
    return (
      <div className="club-antenna" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
        <p style={{ fontSize: '0.8rem' }}>Recherche du signal du Club...</p>
      </div>
    );
  }

  if (artists.length === 0) {
    return (
      <div className="club-antenna" style={{ padding: '30px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '30px' }}>
        <Radio size={24} style={{ marginBottom: '10px', opacity: 0.3 }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
          Pas assez d'activité dans le club cette semaine pour l'Antenne.<br/>
          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Invite des amis ou écoute plus de musique !</span>
        </p>
      </div>
    );
  }

  return (
    <div className="club-antenna animated">
      <style jsx>{`
        .club-antenna {
          background: linear-gradient(135deg, color-mix(in srgb, var(--accent-green), transparent 92%) 0%, rgba(255, 255, 255, 0.03) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 30px;
          position: relative;
          overflow: hidden;
        }

        .antenna-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .live-badge {
          background: rgba(255, 68, 68, 0.15);
          color: #ff4444;
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
          animation: pulse 2s infinite;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: #ff4444;
          border-radius: 50%;
        }

        .title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .antenna-title {
          font-size: 1.1rem;
          font-weight: 800;
          margin: 0;
          color: white;
        }

        .artist-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .artist-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          position: relative;
        }

        .image-container {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          position: relative;
          border: 3px solid rgba(255,255,255,0.05);
          transition: all 0.3s ease;
        }

        .artist-card:first-child .image-container {
          border-color: var(--accent-green);
          box-shadow: 0 0 20px color-mix(in srgb, var(--accent-green), transparent 70%);
          transform: scale(1.1);
          z-index: 2;
        }

        .image-container img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .fallback-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rank-badge {
          position: absolute;
          bottom: -5px;
          right: -5px;
          width: 24px;
          height: 24px;
          background: var(--bg-dark);
          border: 2px solid var(--accent-green);
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .artist-name {
          font-size: 0.8rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          margin-top: 5px;
        }

        .stats-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @media (max-width: 600px) {
          .image-container {
            width: 55px;
            height: 55px;
          }
          .artist-name {
            font-size: 0.75rem;
          }
          .stats-row {
            font-size: 0.6rem;
          }
        }
      `}</style>

      <div className="antenna-header">
        <div className="title-group">
          <div style={{ background: 'color-mix(in srgb, var(--accent-green), transparent 90%)', padding: '8px', borderRadius: '12px' }}>
            <Radio size={20} color="var(--accent-green)" />
          </div>
          <div>
            <h3 className="antenna-title">L'Antenne du Club</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Ce que vos amis écoutent en boucle cette semaine
            </p>
          </div>
        </div>
        <div className="live-badge">
          <div className="dot" /> LIVE
        </div>
      </div>

      <div className="artist-grid">
        {artists.map((artist, index) => (
          <div key={artist.name} className="artist-card">
            <div className="image-container">
              {artist.image_url ? (
                <img src={artist.image_url} alt={artist.name} />
              ) : (
                <div className="fallback-img">
                  <Music size={20} opacity={0.3} />
                </div>
              )}
              <div className="rank-badge">{index + 1}</div>
            </div>
            <div className="artist-name">{artist.name}</div>
            <div className="stats-row">
              <Users size={10} />
              <span>{artist.listener_count} auditeur{artist.listener_count > 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.03 }}>
        <Radio size={120} />
      </div>
    </div>
  );
}
