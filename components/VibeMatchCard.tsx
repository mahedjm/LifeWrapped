'use client';

import { useState, useEffect } from 'react';
import { Heart, Sparkles, Music, Users, Loader2 } from 'lucide-react';

interface VibeMatchData {
  friend: string;
  score: number;
  commonArtist: {
    name: string;
    image_url: string | null;
  } | null;
  message?: string;
}

export default function VibeMatchCard() {
  const [data, setData] = useState<VibeMatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Analyse des atomes crochus musicaux...");

  const loadingPhrases = [
    "Analyse des atomes crochus musicaux...",
    "Synchronisation des ondes sonores...",
    "Calcul de l'indice de Vibe...",
    "Recherche de ton âme sœur musicale...",
    "Alignement des playlists...",
  ];

  useEffect(() => {
    let phraseIndex = 0;
    const interval = setInterval(() => {
      phraseIndex = (phraseIndex + 1) % loadingPhrases.length;
      setLoadingText(loadingPhrases[phraseIndex]);
    }, 2000);

    const fetchMatch = async () => {
      try {
        const res = await fetch('/api/friends/vibe-match');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch vibe match', err);
      } finally {
        setTimeout(() => setLoading(false), 3000); // Pour laisser le temps de voir les phrases :)
      }
    };

    fetchMatch();
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="vibe-card loading">
        <style jsx>{`
          .vibe-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 220px;
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
          }
          .loader-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            z-index: 2;
          }
          .phrase {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 500;
            animation: fadeInOut 2s infinite;
          }
          .glow {
            position: absolute;
            width: 150px;
            height: 150px;
            background: var(--accent-green);
            filter: blur(80px);
            opacity: 0.1;
            border-radius: 50%;
            animation: pulse 4s infinite;
          }
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.3; transform: translateY(5px); }
            50% { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.1; }
            50% { transform: scale(1.5); opacity: 0.2; }
          }
        `}</style>
        <div className="glow" />
        <div className="loader-container">
          <Loader2 className="animate-spin" size={32} color="var(--accent-green)" />
          <p className="phrase">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (!data || data.message) {
    return (
      <div className="vibe-card empty">
        <style jsx>{`
          .vibe-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px dashed rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
          }
          .icon-box {
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
          }
          p { opacity: 0.5; font-size: 0.9rem; margin: 0; }
        `}</style>
        <div className="icon-box"><Users size={20} opacity={0.3} /></div>
        <p>{data?.message || "Pas encore de match cette semaine. Ajoute plus d'amis !"}</p>
      </div>
    );
  }

  return (
    <div className="vibe-card success animated">
      <style jsx>{`
        .vibe-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, color-mix(in srgb, var(--accent-green), transparent 95%) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 25px;
          margin-bottom: 30px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 25px;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .vibe-card::after {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, var(--accent-green) 0%, transparent 70%);
          opacity: 0.1;
          filter: blur(40px);
          pointer-events: none;
        }
        .score-circle {
          position: relative;
          width: 100px;
          height: 100px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .score-svg {
          transform: rotate(-90deg);
          width: 100px;
          height: 100px;
        }
        .score-bg {
          fill: none;
          stroke: rgba(255, 255, 255, 0.05);
          stroke-width: 8;
        }
        .score-fill {
          fill: none;
          stroke: var(--accent-green);
          stroke-width: 8;
          stroke-linecap: round;
          stroke-dasharray: 283;
          stroke-dashoffset: ${283 - (283 * data.score) / 100};
          transition: stroke-dashoffset 1.5s ease-out;
        }
        .score-value {
          position: absolute;
          font-size: 1.4rem;
          font-weight: 900;
          color: white;
          text-shadow: 0 0 15px color-mix(in srgb, var(--accent-green), transparent 50%);
        }
        .content {
          flex: 1;
          z-index: 1;
        }
        .label {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--accent-green);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .title {
          font-size: 1.3rem;
          font-weight: 900;
          margin: 0 0 4px 0;
          line-height: 1.1;
        }
        .subtitle {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 15px;
        }
        .common-artist {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.05);
          padding: 8px 12px;
          border-radius: 12px;
          width: fit-content;
        }
        .artist-img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }
        .artist-name {
          font-size: 0.8rem;
          font-weight: 600;
        }
        @media (max-width: 600px) {
          .vibe-card {
            padding: 20px 15px;
            gap: 10px;
            flex-direction: row;
            text-align: left;
          }
          .score-circle {
            transform: scale(0.75);
            margin: -12px; /* Compensate for the visual scale reduction */
          }
          .title {
            font-size: 1.1rem;
          }
          .subtitle {
            font-size: 0.8rem;
            margin-bottom: 10px;
          }
          .label {
            font-size: 0.65rem;
            letter-spacing: 1px;
            margin-bottom: 4px;
          }
          .common-artist {
            margin: 0;
            padding: 6px 10px;
          }
          .artist-img {
            width: 20px;
            height: 20px;
          }
          .artist-name {
            font-size: 0.75rem;
          }
        }
      `}</style>

      <div className="score-circle">
        <svg className="score-svg">
          <circle className="score-bg" cx="50" cy="50" r="45" />
          <circle className="score-fill" cx="50" cy="50" r="45" />
        </svg>
        <div className="score-value">{data.score}%</div>
      </div>

      <div className="content">
        <div className="label">
          <Sparkles size={12} /> Vibe Match de la semaine
        </div>
        <h3 className="title">@{data.friend}</h3>
        <p className="subtitle">C'est ton âme sœur musicale actuelle !</p>

        {data.commonArtist && (
          <div className="common-artist">
            {data.commonArtist.image_url ? (
              <img src={data.commonArtist.image_url} alt="" className="artist-img" />
            ) : (
              <div className="artist-img" style={{ background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music size={12} />
              </div>
            )}
            <span className="artist-name">Fan de <strong>{data.commonArtist.name}</strong></span>
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', top: '15px', right: '15px', opacity: 0.2 }}>
        <Heart size={20} fill="var(--accent-green)" stroke="none" />
      </div>
    </div>
  );
}
