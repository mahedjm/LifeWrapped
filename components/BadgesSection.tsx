'use client';

import { useState, useEffect } from 'react';
import { Sunrise, Moon, Compass, Heart, Headphones, Lock, CheckCircle2, Award, Users } from 'lucide-react';
import { Badge } from '@/lib/types';

const ICON_MAP: Record<string, any> = {
  Sunrise,
  Moon,
  Compass,
  Heart,
  Headphones,
  Users
};

const LEVEL_COLORS = {
  1: '#cd7f32', // Bronze
  2: '#c0c0c0', // Argent
  3: '#ffd700', // Or
  4: '#b9f2ff'  // Diamant
};

interface BadgesSectionProps {
  badges?: Badge[];
}

export default function BadgesSection({ badges = [] }: BadgesSectionProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="badges-container animated" style={{ animationDelay: '0.3s' }}>
      <style jsx>{`
        .badges-container {
          margin: 20px 0;
        }
        .badge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
          gap: 10px;
        }
        .badge-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          transition: all 0.3s ease;
          overflow: hidden;
          min-height: 180px;
        }
        .badge-card.unlocked {
          background: rgba(255, 255, 255, 0.05);
        }
        .badge-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.08);
        }
        .icon-wrapper {
          width: 45px;
          height: 45px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          position: relative;
          z-index: 2;
        }
        .badge-name {
          font-weight: 800;
          font-size: 0.85rem;
          margin-bottom: 4px;
          color: white;
        }
        .level-tag {
          font-size: 0.6rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 8px;
          border-radius: 20px;
          margin-bottom: 8px;
          background: rgba(255,255,255,0.05);
        }
        .badge-desc {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
          line-height: 1.3;
          margin-bottom: 12px;
        }
        .progress-container {
          width: 100%;
          margin-top: auto;
        }
        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.6rem;
          font-weight: 700;
          margin-bottom: 4px;
          color: rgba(255,255,255,0.3);
        }
        .progress-bar {
          width: 100%;
          height: 5px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          transition: width 1s ease-out;
        }
        .status-tag {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 3;
        }
        .glow-effect {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background: radial-gradient(circle at center, var(--level-color) 0%, transparent 70%);
          opacity: 0.05;
          pointer-events: none;
        }
      `}</style>

      <div className="section-badge-container" style={{ marginBottom: '25px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
          padding: '8px 24px',
          borderRadius: '50px',
          border: '1px solid color-mix(in srgb, var(--accent-green), transparent 85%)',
          width: 'fit-content'
        }}>
          <Award size={18} color="var(--accent-green)" />
          <h2 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Progression & Succès
          </h2>
        </div>
      </div>

      <div className="badge-grid">
        {badges.map(badge => {
          const IconComponent = ICON_MAP[badge.icon] || Compass;
          const levelColor = badge.level > 0 ? (LEVEL_COLORS[badge.level as keyof typeof LEVEL_COLORS] || '#fff') : 'rgba(255,255,255,0.2)';
          
          return (
            <div 
              key={badge.id} 
              className={`badge-card ${badge.isUnlocked ? 'unlocked' : 'locked'}`}
              style={{ 
                '--level-color': levelColor,
                borderColor: badge.level > 0 ? `${levelColor}44` : 'var(--glass-border)'
              } as any}
            >
              <div className="glow-effect" />
              
              <div className="status-tag">
                {badge.isUnlocked ? (
                  <CheckCircle2 size={16} fill={levelColor} stroke="black" />
                ) : (
                  <Lock size={14} opacity={0.3} />
                )}
              </div>
              
              <div className="icon-wrapper" style={{ color: levelColor, background: `${levelColor}11`, border: `1px solid ${levelColor}22` }}>
                <IconComponent size={28} />
              </div>

              <div className="badge-name">{badge.name}</div>
              
              {badge.level > 0 ? (
                <div className="level-tag" style={{ color: levelColor, background: `${levelColor}15` }}>
                  {badge.levelName} (Niv. {badge.level})
                </div>
              ) : (
                <div className="level-tag locked" style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' }}>
                  Bloqué (Niv. 0)
                </div>
              )}

              <div className="badge-desc">{badge.description}</div>

              {!badge.isMaxLevel && (
                <div className="progress-container">
                  <div className="progress-info">
                    <span>
                      {badge.currentVal} {
                        badge.id === 'explorer' ? 'artistes' : 
                        badge.id === 'loyal' ? 'jours' : 
                        badge.id === 'melomaniac' ? 'heures' : 
                        'amis'
                      }
                    </span>
                    <span>
                      Objectif {badge.nextThreshold}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${badge.progress}%`, background: levelColor }} />
                  </div>
                </div>
              )}
              
              {badge.isMaxLevel && (
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: levelColor, marginTop: 'auto' }}>
                  🏆 NIVEAU MAXIMUM ATTEINT
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
