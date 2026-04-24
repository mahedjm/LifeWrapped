'use client';

import { Palette, Share2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { PALETTES } from '@/lib/constants';

interface FloatingActionsProps {
  themeColor: string;
  setThemeColor: (color: string) => void;
  showPalette: boolean;
  setShowPalette: (show: boolean) => void;
  handleExport: () => void;
  fetchStats: (manual: boolean) => void;
  syncing: boolean;
  manualSyncing: boolean;
  hasStats: boolean;
  activeTab: string;
  onActionStart?: () => void;
}

/**
 * Composant centralisant tous les boutons flottants (Mobile Only)
 * Situé en bas à droite de l'écran, au-dessus de la barre de navigation.
 */
export default function FloatingActions({
  themeColor,
  setThemeColor,
  showPalette,
  setShowPalette,
  handleExport,
  fetchStats,
  syncing,
  manualSyncing,
  hasStats,
  activeTab,
  onActionStart
}: FloatingActionsProps) {
  
  const handleTogglePalette = (e: React.MouseEvent) => {
    e.stopPropagation();
    onActionStart?.();
    setShowPalette(!showPalette);
  };

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchStats(true);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleExport();
  };

  return (
    <div className="floating-actions-container mobile-only">
      {/* 1. BOUTON PARTAGER (GÉNÉRER IMAGE) - Uniquement sur l'accueil */}
      {activeTab === 'accueil' && (
        <button 
          className="fab fab-share" 
          onClick={handleShare}
          disabled={syncing || !hasStats}
          title="Partager mon mois"
        >
          <Share2 size={22} />
        </button>
      )}

      {/* 2. BOUTON PALETTE (CHANGER THÈME) */}
      <div className="fab-palette-wrapper">
        {showPalette && (
          <div className="palette-slide-out">
            {PALETTES.map(p => (
              <button
                key={p.id}
                className="color-dot"
                style={{ 
                  backgroundColor: p.color, 
                  border: themeColor === p.color ? '2px solid white' : '1px solid rgba(255,255,255,0.2)' 
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setThemeColor(p.color);
                }}
              />
            ))}
          </div>
        )}
        <button 
          className={`fab fab-palette ${showPalette ? 'active' : ''}`}
          onClick={handleTogglePalette}
          title="Changer le thème"
        >
          <Palette size={22} color={showPalette ? 'var(--accent-green)' : 'white'} />
        </button>
      </div>

      {/* 3. BOUTON SYNCHRONISER (LAST.FM) */}
      <div className="fab-sync-wrapper">
        {manualSyncing && <span className="sync-label">Synchronisation...</span>}
        <button 
          className="fab fab-sync" 
          onClick={handleSync} 
          disabled={syncing}
          title="Synchroniser mes écoutes"
        >
          <RefreshCw size={22} className={syncing ? 'animate-spin' : ''} />
        </button>
      </div>

      <style jsx>{`
        .floating-actions-container {
          position: fixed;
          bottom: 100px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          z-index: 1500;
        }

        .fab {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          color: white;
        }

        .fab:hover {
          transform: scale(1.05);
          background: rgba(255, 255, 255, 0.1);
        }

        .fab:active {
          transform: scale(0.95);
        }

        .fab:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Styles spécifiques par bouton */
        .fab-palette.active {
          background: color-mix(in srgb, var(--accent-green), transparent 85%);
          border-color: var(--accent-green);
        }

        .fab-share {
          background: color-mix(in srgb, var(--accent-green), transparent 85%);
          color: var(--accent-green);
          border-color: color-mix(in srgb, var(--accent-green), transparent 75%);
        }

        .fab-sync {
          background: rgba(255, 255, 255, 0.08);
        }

        .fab-sync-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .sync-label {
          position: absolute;
          right: 65px;
          background: rgba(18, 18, 18, 0.95);
          backdrop-filter: blur(10px);
          color: var(--accent-green);
          padding: 0 20px;
          height: 52px;
          border-radius: 26px;
          display: flex;
          align-items: center;
          font-size: 0.85rem;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid var(--glass-border);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease forwards;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .fab-palette-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .palette-slide-out {
          position: absolute;
          right: 65px;
          background: rgba(18, 18, 18, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 0 15px;
          height: 52px;
          border-radius: 26px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--glass-border);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          animation: slideLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          z-index: -1;
        }

        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .color-dot {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          padding: 0;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
        }

        .color-dot:hover {
          transform: scale(1.15);
        }

        .color-dot:active {
          transform: scale(0.9);
        }

        @media (max-width: 1023px) {
          .mobile-only { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}
