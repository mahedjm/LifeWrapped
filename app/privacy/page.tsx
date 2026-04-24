'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Clock, Eye, Trash2 } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <main className="dashboard animated" style={{ minHeight: '100vh', padding: '40px 20px 100px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button 
          onClick={() => router.back()}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            cursor: 'pointer',
            marginBottom: '40px',
            padding: '10px 0'
          }}
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        <header style={{ marginBottom: '60px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '-1px' }}>
            Confidentialité
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Chez Écho, nous respectons vos données musicales autant que vos oreilles. 
            Voici comment nous traitons vos informations en toute transparence.
          </p>
        </header>

        <div style={{ display: 'grid', gap: '40px' }}>
          <section className="glass-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(29, 185, 84, 0.1)', borderRadius: '12px' }}>
                <Eye size={24} color="#1db954" />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Provenance des données</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Toutes les données musicales affichées sur Écho proviennent directement de votre compte <strong>Last.fm</strong> via leur API officielle. 
              Nous ne collectons que ce qui est nécessaire pour générer vos classements et votre Wrapped.
            </p>
          </section>

          <section className="glass-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(255, 68, 68, 0.1)', borderRadius: '12px' }}>
                <Clock size={24} color="#ff4444" />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Mise en cache temporaire</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Conformément aux conditions de Last.fm, nous ne créons pas de base de données permanente de votre historique complet. 
              Nous stockons temporairement (mise en cache) vos statistiques récentes pour permettre l'affichage fluide de vos classements 
              et le partage avec vos amis dans l'onglet "Amis".
            </p>
          </section>

          <section className="glass-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(162, 56, 255, 0.1)', borderRadius: '12px' }}>
                <Shield size={24} color="#A238FF" />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Sécurité & Partage</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Vos données ne sont jamais vendues, ni partagées avec des tiers publicitaires. 
              Elles ne sont visibles que par vous et les amis que vous avez explicitement acceptés sur la plateforme.
            </p>
          </section>

          <section className="glass-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                <Trash2 size={24} color="white" />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Droit à l'oubli</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Vous pouvez à tout moment vous déconnecter ou demander la suppression de votre compte Écho. 
              Toutes les données mises en cache vous concernant seront alors immédiatement et définitivement supprimées.
            </p>
          </section>
        </div>

        <footer style={{ marginTop: '80px', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
          <p>Dernière mise à jour : Avril 2026</p>
          <p style={{ marginTop: '10px' }}>Powered by Last.fm API</p>
        </footer>
      </div>
    </main>
  );
}
