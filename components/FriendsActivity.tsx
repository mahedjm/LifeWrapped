'use client';

import { Users, Trophy, Music } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatTime } from '@/lib/utils';

interface FriendActivity {
  id: string;
  username: string;
  isMe: boolean;
  nowPlaying: {
    name: string;
    artist: string;
    image: string;
  } | null;
  weeklyTotalMs: number;
  commonArtists?: string[];
  timeDiffMs?: number;
}

interface FriendsActivityProps {
  onFriendClick?: (id: string) => void;
}

export default function FriendsActivity({ onFriendClick }: FriendsActivityProps) {
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = async () => {
    try {
      const res = await fetch('/api/friends/activity');
      const data = await res.json();
      if (data.activity) {
        setActivities(data.activity);
      }
    } catch (e) {
      console.error('Failed to fetch friends activity', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000); // Rafraîchir toutes les 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && activities.length === 0) return null;
  if (!loading && activities.length === 0) return null;

  const liveFriends = activities.filter(a => a.nowPlaying && !a.isMe);

  return (
    <div className="friends-activity-container animated" style={{ animationDelay: '0.2s' }}>
      <style jsx>{`
        .friends-activity-container {
          margin-bottom: 40px;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .live-grid {
          display: flex;
          gap: 15px;
          overflow-x: auto;
          padding-bottom: 10px;
          margin-bottom: 25px;
          scrollbar-width: none;
        }
        .live-grid::-webkit-scrollbar { display: none; }
        
        .live-card {
          flex-shrink: 0;
          width: 220px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        .live-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--accent-green);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          cursor: pointer;
        }
        .live-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #ff4444;
          color: white;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 20px;
          animation: pulse 1.5s infinite;
          letter-spacing: 0.5px;
          box-shadow: 0 0 10px rgba(255, 68, 68, 0.4);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        .friend-name {
          font-weight: 800;
          font-size: 0.85rem;
          color: var(--accent-green);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .track-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .track-img {
          width: 45px;
          height: 45px;
          border-radius: 8px;
          object-fit: cover;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .track-details {
          overflow: hidden;
          flex: 1;
        }
        .track-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .artist-name {
          font-size: 0.75rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .leaderboard {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 350px), 1fr));
          gap: 15px;
        }
        .leader-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 18px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .leader-item.is-me {
          background: rgba(29, 185, 84, 0.05);
          border-color: rgba(29, 185, 84, 0.2);
        }
        .leader-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255,255,255,0.1);
          cursor: pointer;
        }
        .rank {
          font-weight: 900;
          font-size: 1.4rem;
          color: var(--text-secondary);
          opacity: 0.2;
          width: 30px;
          font-style: italic;
        }
        .leader-info {
          flex: 1;
        }
        .leader-username {
          font-weight: 700;
          font-size: 1rem;
          color: white;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .me-tag {
          font-size: 0.65rem;
          background: var(--accent-green);
          color: black;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 800;
        }
        .leader-time {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--accent-green);
        }
        .leader-sub {
          font-size: 0.75rem;
          opacity: 0.5;
          font-weight: 400;
        }
        .comparison-text {
          font-size: 0.75rem;
          margin-top: 4px;
          font-weight: 500;
        }
        .common-artists {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 20px;
          margin-top: 6px;
          color: var(--text-secondary);
        }
      `}</style>

      <div className="section-badge-container" style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(29, 185, 84, 0.1)',
          padding: '8px 24px',
          borderRadius: '50px',
          border: '1px solid rgba(29, 185, 84, 0.15)',
          width: 'fit-content'
        }}>
          <Users size={18} color="var(--accent-green)" />
          <h2 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Activité du Club
          </h2>
        </div>
      </div>

      {liveFriends.length > 0 && (
        <div className="live-grid">
          {liveFriends.map(friend => (
            <div key={friend.id} className="live-card" onClick={() => onFriendClick?.(friend.id)}>
              <div className="live-badge">LIVE</div>
              <div className="friend-name">@{friend.username}</div>
              <div className="track-info">
                {friend.nowPlaying?.image ? (
                  <img src={friend.nowPlaying.image} className="track-img" alt="cover" />
                ) : (
                  <div className="track-img" style={{ background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music size={20} color="#555" />
                  </div>
                )}
                <div className="track-details">
                  <div className="track-name">{friend.nowPlaying?.name}</div>
                  <div className="artist-name">{friend.nowPlaying?.artist}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="leaderboard">
        {activities.map((friend, index) => (
          <div key={friend.id} className={`leader-item ${friend.isMe ? 'is-me' : ''}`} onClick={() => !friend.isMe && onFriendClick?.(friend.id)}>
            <div className="rank">{index + 1}</div>
            <div className="leader-info">
              <div className="leader-username">
                {friend.username} {friend.isMe && <span className="me-tag">VOUS</span>}
              </div>
              <div className="leader-time">
                {formatTime(friend.weeklyTotalMs)} <span className="leader-sub">cette semaine</span>
              </div>
              
              {!friend.isMe && friend.timeDiffMs !== undefined && (
                <>
                  <div className="comparison-text" style={{ color: friend.timeDiffMs >= 0 ? '#1DB954' : '#ff4444' }}>
                    {friend.timeDiffMs >= 0 
                      ? `+${formatTime(friend.timeDiffMs)} que lui`
                      : `-${formatTime(Math.abs(friend.timeDiffMs))} que lui`}
                  </div>
                  
                  {friend.commonArtists && friend.commonArtists.length > 0 && (
                    <div className="common-artists">
                      <Music size={10} />
                      {friend.commonArtists.length} artistes en commun
                    </div>
                  )}
                </>
              )}
            </div>
            
            {index === 0 && (
              <div style={{ 
                background: 'rgba(255, 215, 0, 0.1)', 
                padding: '10px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 215, 0, 0.2)'
              }}>
                <Trophy size={20} color="#FFD700" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
