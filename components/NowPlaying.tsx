'use client';

import { Music } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NowPlayingProps {
  track: {
    name: string;
    artist: string;
    album: string;
    image: string;
  } | null;
}

export default function NowPlaying({ track }: NowPlayingProps) {
  const [currentImage, setCurrentImage] = useState<string | null>(track?.image || null);
  const [prevImage, setPrevImage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (track?.image && track.image !== currentImage) {
      setPrevImage(currentImage);
      setCurrentImage(track.image);
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPrevImage(null);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [track?.image]);

  if (!track) return null;

  return (
    <div className="now-playing-container animated">
      <style jsx>{`
        .now-playing-container {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          overflow: hidden;
          margin-bottom: 30px;
          backdrop-filter: blur(10px);
          animation: slideDown 0.5s ease-out;
        }

        .now-playing-container::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, color-mix(in srgb, var(--accent-green), transparent 85%) 0%, transparent 70%);
          animation: pulseGlow 4s infinite ease-in-out;
          pointer-events: none;
        }

        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .art-container {
          position: relative;
          width: 80px;
          height: 80px;
          flex-shrink: 0;
        }

        .album-art-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 8px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.3);
          z-index: 2;
        }

        .album-art {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 2;
        }

        .album-art.new {
          animation: fadeIn 0.6s ease-in-out forwards;
          z-index: 3;
        }

        .album-art.old {
          animation: fadeOut 0.6s ease-in-out forwards;
          z-index: 2;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.1); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.95); }
        }

        .live-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #e91e63;
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 10px;
          z-index: 10;
          letter-spacing: 1px;
          box-shadow: 0 4px 10px rgba(233, 30, 99, 0.4);
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.95); }
        }

        .track-info {
          flex-grow: 1;
          z-index: 2;
        }

        .track-name {
          font-size: 1.2rem;
          font-weight: 800;
          color: white;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .artist-name {
          color: var(--accent-green);
          font-weight: 600;
          font-size: 1rem;
        }

        .visualizer {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 30px;
          margin-left: auto;
          padding-right: 10px;
        }

        .bar {
          width: 4px;
          background: var(--accent-green);
          border-radius: 2px;
          animation: bounce 1s infinite ease-in-out;
        }

        @keyframes bounce {
          0%, 100% { height: 5px; }
          50% { height: 25px; }
        }

        .bar:nth-child(2) { animation-delay: 0.2s; }
        .bar:nth-child(3) { animation-delay: 0.4s; }
        .bar:nth-child(4) { animation-delay: 0.1s; }
        .bar:nth-child(5) { animation-delay: 0.3s; }
      `}</style>

      <div className="art-container">
        <div className="live-badge">LIVE</div>
        <div className="album-art-wrapper">
          {/* Image Précédente */}
          {prevImage && (
            <img src={prevImage} alt="previous" className="album-art old" />
          )}

          {/* Image Actuelle */}
          {currentImage ? (
            <img 
              key={currentImage} 
              src={currentImage} 
              alt={track.album} 
              className={`album-art ${isTransitioning ? 'new' : ''}`} 
            />
          ) : (
            <div className="album-art" style={{ background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music size={30} color="#555" />
            </div>
          )}
        </div>
      </div>

      <div className="track-info">
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px', fontWeight: 700 }}>
          Mode Party Actif • En écoute
        </div>
        <div className="track-name">{track.name}</div>
        <div className="artist-name">{track.artist}</div>
      </div>

      <div className="visualizer">
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>
    </div>
  );
}
