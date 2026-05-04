import React from 'react';

interface UserAvatarProps {
  username: string;
  badges?: any[];
  totalLevel?: number;
  size?: number;
  themeColor: string;
}

export default function UserAvatar({ username, badges = [], totalLevel: providedLevel, size = 70, themeColor }: UserAvatarProps) {
  // Calcul du niveau global basé sur la somme des niveaux de tous les badges ou la valeur fournie
  const totalLevel = providedLevel !== undefined ? providedLevel : (badges?.reduce((acc, b) => acc + (b.level || 0), 0) || 0);
  
  let globalLevel = 1;
  if (totalLevel >= 14) globalLevel = 4;      // Légende
  else if (totalLevel >= 10) globalLevel = 3; // Expert
  else if (totalLevel >= 5) globalLevel = 2;  // Confirmé
  
  const firstLetter = username ? username.charAt(0).toUpperCase() : '?';

  return (
    <div className={`avatar-container level-${globalLevel}`} style={{ 
      width: size, 
      height: size,
      '--avatar-size': `${size}px`,
      '--theme-color': themeColor
    } as any}>
      <div className="avatar-inner">
        {firstLetter}
      </div>
      
      {/* Glow effect for Level 3 & 4 */}
      {(globalLevel === 3 || globalLevel === 4) && (
        <div className="avatar-glow" />
      )}

      <style jsx>{`
        .avatar-container {
          position: relative;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .avatar-inner {
          width: 100%;
          height: 100%;
          background: #111;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--theme-color);
          font-weight: 900;
          font-size: calc(var(--avatar-size) * 0.45);
          border: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 2;
          position: relative;
        }

        .avatar-glow {
          position: absolute;
          inset: -5px;
          background: var(--theme-color);
          filter: blur(15px);
          opacity: 0.3;
          border-radius: 30px;
          z-index: 0;
          animation: pulse-glow 3s infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }

        /* NIVEAU 1 : Bordure simple */
        .level-1 {
          border: 2px solid var(--theme-color);
        }

        /* NIVEAU 2 : Double bordure */
        .level-2 {
          border: 2px solid var(--theme-color);
        }
        .level-2::before {
          content: '';
          position: absolute;
          inset: -6px;
          border: 1px solid color-mix(in srgb, var(--theme-color), transparent 60%);
          border-radius: 28px;
        }

        /* NIVEAU 3 : Bordure épaisse + Glow */
        .level-3 {
          border: 3px solid var(--theme-color);
        }

        /* NIVEAU 4 : Bordure animée "Légende" */
        .level-4 {
          background: linear-gradient(
            45deg, 
            var(--theme-color), 
            #fff, 
            var(--theme-color), 
            #fff
          );
          background-size: 300% 300%;
          animation: border-flow 4s linear infinite;
        }

        @keyframes border-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .level-4::after {
          content: '';
          position: absolute;
          inset: -8px;
          border: 2px solid var(--theme-color);
          border-radius: 32px;
          opacity: 0.5;
          animation: ping-ring 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes ping-ring {
          0% { transform: scale(1); opacity: 0.5; }
          70%, 100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
