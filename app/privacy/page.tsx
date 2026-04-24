'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Shield, Clock, Eye, Trash2, ChevronDown, 
  Music, Users, Zap, Bell, User, RefreshCw, Share2, LogOut 
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useStats } from '@/hooks/useStats';
import { useNotifications } from '@/hooks/useNotifications';
import { PALETTES } from '@/lib/constants';

interface PrivacySectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: string;
  color: string;
  bg: string;
}

function PrivacySection({ id, icon, title, content, color, bg }: PrivacySectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sur desktop on laisse ouvert par défaut, sur mobile c'est replié
  const showContent = !isMobile || isOpen;

  return (
    <section className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div 
        onClick={() => isMobile && setIsOpen(!isOpen)}
        style={{ 
          padding: '18px 30px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: isMobile ? 'pointer' : 'default',
          background: isOpen && isMobile ? 'rgba(255,255,255,0.05)' : 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '8px', background: bg, borderRadius: '10px' }}>
            {icon}
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{title}</h2>
        </div>
        {isMobile && (
          <ChevronDown 
            size={20} 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
              transition: 'transform 0.3s ease',
              opacity: 0.5
            }} 
          />
        )}
      </div>
      
      <div style={{ 
        maxHeight: showContent ? '500px' : '0px',
        opacity: showContent ? 1 : 0,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: showContent ? '12px 30px 30px 30px' : '0 30px'
      }}>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
          {content}
        </p>
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  const router = useRouter();
  const { themeColor, setThemeColor } = useTheme();
  const { stats, fetchStats } = useStats('week', 'week', 'week', 5, 5);
  const { notifications, toggleNotifications } = useNotifications();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <main className="dashboard animated">
      {/* --- Header --- */}
      <header className="main-header">
        {/* --- DESKTOP HEADER --- */}
        <div className="desktop-only">
          <div className="header-top">
            <div className="logo-container" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
              <div className="logo-wave" />
              <div className="logo-wave" />
              <div className="logo-wave" />
              <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--accent-green)', position: 'relative', zIndex: 2 }}>Écho</h1>
            </div>

            <nav className="desktop-nav">
              <button onClick={() => router.push('/')}>
                <Music size={18} /> Accueil
              </button>
              <button onClick={() => router.push('/')}>
                <Zap size={18} /> Club
              </button>
              <button onClick={() => router.push('/')}>
                <Users size={18} /> Amis
              </button>
            </nav>
            
            <div className="header-controls">
              {stats?.username && (
                <div className="user-badge">
                  <div className="user-info">
                    <User size={14} />
                    <span>Connecté en tant que&nbsp;</span>
                    <strong>{stats.username}</strong>
                  </div>
                  <button className="logout-btn" onClick={handleLogout}><LogOut size={18} /></button>
                </div>
              )}

              <div className="notif-wrapper" style={{ marginLeft: '10px' }}>
                <button className="notif-btn" onClick={toggleNotifications}>
                  <Bell size={20} />
                  {notifications.some(n => n.status === 'unread') && <div className="notif-badge" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- MOBILE HEADER --- */}
        <div className="mobile-only">
          <div className="header-top" style={{ marginBottom: '40px', justifyContent: 'center' }}>
            <div className="logo-container" style={{ margin: 0 }}>
              <div className="logo-wave" />
              <div className="logo-wave" />
              <div className="logo-wave" />
              <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--accent-green)', position: 'relative', zIndex: 2 }}>Écho</h1>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px' }}>


        <header style={{ marginBottom: '60px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '-1px' }}>
            Confidentialité
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Chez Écho, nous respectons vos données musicales autant que vos oreilles. 
            Voici comment nous traitons vos informations en toute transparence.
          </p>
        </header>

        <div style={{ display: 'grid', gap: '20px' }}>
          <PrivacySection 
            id="provenance"
            icon={<Eye size={22} color="#1db954" />}
            title="Provenance des données"
            bg="rgba(29, 185, 84, 0.1)"
            color="#1db954"
            content="Toutes les données musicales affichées sur Écho proviennent directement de votre compte Last.fm via leur API officielle. Nous ne collectons que ce qui est nécessaire pour générer vos classements et votre Wrapped."
          />

          <PrivacySection 
            id="cache"
            icon={<Clock size={22} color="#ff4444" />}
            title="Mise en cache temporaire"
            bg="rgba(255, 68, 68, 0.1)"
            color="#ff4444"
            content="Conformément aux conditions de Last.fm, nous ne créons pas de base de données permanente de votre historique complet. Nous stockons temporairement (mise en cache) vos statistiques récentes pour permettre l'affichage fluide de vos classements et le partage avec vos amis."
          />

          <PrivacySection 
            id="security"
            icon={<Shield size={22} color="#A238FF" />}
            title="Sécurité & Partage"
            bg="rgba(162, 56, 255, 0.1)"
            color="#A238FF"
            content="Vos données ne sont jamais vendues, ni partagées avec des tiers publicitaires. Elles ne sont visibles que par vous et les amis que vous avez explicitement acceptés sur la plateforme."
          />

          <PrivacySection 
            id="rights"
            icon={<Trash2 size={22} color="white" />}
            title="Droit à l'oubli"
            bg="rgba(255, 255, 255, 0.1)"
            color="white"
            content="Vous pouvez à tout moment vous déconnecter ou demander la suppression de votre compte Écho. Toutes les données mises en cache vous concernant seront alors immédiatement et définitivement supprimées."
          />
        </div>

      </div>

      <footer className="footer-credits">
        <div className="footer-divider" />
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-name">Écho</span>
            <span className="brand-dot">•</span>
            <span className="brand-desc">Ton univers musical</span>
          </div>
          <div className="footer-links">
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>Màj : Avril 2026</p>
            <span className="footer-link-dot">•</span>
            <div className="lastfm-credit">
              <span>Powered by</span>
              <a href="https://www.last.fm" target="_blank" rel="noopener noreferrer" className="lastfm-link">
                <img src="https://www.last.fm/static/images/footer_logo@2x.49ca51948b0a.png" alt="Last.fm" className="lastfm-logo" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* --- Bottom Nav --- */}
      <nav className="bottom-nav">
        <div className="nav-item" onClick={() => router.push('/')}>
          <div className="icon-wrapper"><Music size={24} /></div>
          <span>Accueil</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/')}>
          <div className="icon-wrapper"><Users size={24} /></div>
          <span>Amis</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/')}>
          <div className="icon-wrapper"><Zap size={24} /></div>
          <span>Club</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/')}>
          <div className="icon-wrapper"><Bell size={24} /></div>
          <span>Notifications</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/')}>
          <div className="icon-wrapper"><User size={24} /></div>
          <span>Compte</span>
        </div>
      </nav>
    </main>
  );
}
