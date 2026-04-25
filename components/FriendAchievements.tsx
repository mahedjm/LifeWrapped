'use client';

import { useState, useEffect } from 'react';
import { Award, Compass, Heart, Headphones, Users, ChevronRight, Clock } from 'lucide-react';

interface Achievement {
  badge_id: string;
  level: number;
  unlocked_at: string;
  username: string;
  badgeName: string;
  levelName: string;
  isMe: boolean;
}

const BADGE_ICONS: Record<string, any> = {
  explorer: Compass,
  loyal: Heart,
  melomaniac: Headphones,
  ambassador: Users
};

const LEVEL_COLORS = ['#cd7f32', '#c0c0c0', '#ffd700', '#00f2ff'];

export default function FriendAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch('/api/club/achievements');
        const data = await res.json();
        if (data.achievements) {
          setAchievements(data.achievements);
        }
      } catch (err) {
        console.error('Failed to fetch achievements', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  if (loading || achievements.length === 0) return null;

  return (
    <div className="achievements-wall animated">
      <style jsx>{`
        .achievements-wall {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 30px;
        }

        .wall-title {
          font-size: 1rem;
          font-weight: 800;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
        }

        .achievement-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .achievement-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.02);
          transition: transform 0.2s ease;
        }

        .achievement-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .icon-container {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .achievement-info {
          flex-grow: 1;
        }

        .achievement-text {
          font-size: 0.85rem;
          margin-bottom: 2px;
          color: var(--text-secondary);
        }

        .highlight {
          color: white;
          font-weight: 700;
        }

        .badge-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          margin-top: 4px;
        }

        .time-ago {
          font-size: 0.7rem;
          color: var(--text-secondary);
          opacity: 0.5;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        @media (max-width: 600px) {
          .achievement-text {
            font-size: 0.8rem;
          }
        }
      `}</style>

      <h3 className="wall-title">
        <Award size={20} color="var(--accent-green)" />
        Mur des Succès
      </h3>

      <div className="achievement-list">
        {achievements.map((item, idx) => {
          const Icon = BADGE_ICONS[item.badge_id] || Award;
          const levelColor = LEVEL_COLORS[item.level - 1] || '#fff';
          const date = new Date(item.unlocked_at);
          
          return (
            <div key={`${item.username}-${item.badge_id}-${item.level}`} className="achievement-item">
              <div 
                className="icon-container" 
                style={{ background: `${levelColor}20`, color: levelColor, border: `1px solid ${levelColor}40` }}
              >
                <Icon size={20} />
              </div>
              
              <div className="achievement-info">
                <div className="achievement-text">
                  <span className="highlight">{item.isMe ? 'Vous' : `@${item.username}`}</span>
                  {' a atteint le niveau '}
                  <span className="highlight" style={{ color: levelColor }}>{item.level}</span>
                </div>
                <div className="badge-tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                  <Icon size={12} />
                  {item.badgeName} : {item.levelName}
                </div>
              </div>

              <div className="time-ago">
                <Clock size={12} />
                {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
