'use client';

import { X, Music, User, TrendingUp, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatTime } from '@/lib/utils';

interface FriendStats {
  username: string;
  topArtists: { artist: string; total_ms: number; image_url: string | null }[];
  topTracks: { title: string; artist: string; play_count: number; image_url: string | null }[];
}

interface FriendProfileModalProps {
  friendId: string;
  onClose: () => void;
}

export default function FriendProfileModal({ friendId, onClose }: FriendProfileModalProps) {
  const [stats, setStats] = useState<FriendStats | null>(null);
  const [loading, setLoading] = useState(true);

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
              <div className="profile-avatar">
                <User size={40} color="var(--accent-green)" />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>@{stats.username}</h2>
                <p style={{ opacity: 0.5, margin: 0, fontSize: '0.9rem' }}>Profil Écho</p>
              </div>
            </div>

            <div className="stats-sections">
              <section className="stats-column">
                <div className="section-title">
                  <TrendingUp size={18} color="var(--accent-green)" />
                  <h3>Top 5 Artistes <span className="month-tag">du mois</span></h3>
                </div>
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
              </section>

              <section className="stats-column">
                <div className="section-title">
                  <Music size={18} color="var(--accent-green)" />
                  <h3>Top 5 Sons <span className="month-tag">du mois</span></h3>
                </div>
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
              </section>
            </div>
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
          gap: 20px;
          margin-bottom: 40px;
          padding-bottom: 25px;
          border-bottom: 1px solid var(--glass-border);
        }
        .profile-avatar {
          width: 70px;
          height: 70px;
          background: rgba(29, 185, 84, 0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stats-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        @media (max-width: 700px) {
          .stats-sections { grid-template-columns: 1fr; }
          .modal-content { padding: 30px 20px; }
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .section-title h3 { margin: 0; font-size: 1.1rem; }
        .month-tag {
          font-size: 0.7rem;
          background: rgba(255,255,255,0.05);
          padding: 2px 8px;
          border-radius: 4px;
          opacity: 0.6;
          margin-left: 5px;
        }

        .stats-list { display: flex; flex-direction: column; gap: 15px; }
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
        .stat-rank { font-weight: 900; opacity: 0.2; font-size: 1.2rem; width: 20px; }
        .stat-item img { width: 45px; height: 45px; border-radius: 8px; object-fit: cover; }
        .placeholder-img { 
          width: 45px; height: 45px; background: #222; border-radius: 8px; 
          display: flex; align-items: center; justify-content: center; opacity: 0.3;
        }
        .stat-name { font-weight: 700; font-size: 0.9rem; color: white; }
        .stat-sub { font-size: 0.8rem; opacity: 0.5; }

        .loading-state { text-align: center; padding: 60px 0; }
        .spinner {
          width: 40px; height: 40px; border: 4px solid rgba(29, 185, 84, 0.1);
          border-top-color: var(--accent-green); border-radius: 50%;
          margin: 0 auto 20px; animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
