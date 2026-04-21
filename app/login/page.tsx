'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Music } from 'lucide-react';

function LoginForm() {
  const [code, setCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setError(err);
  }, [searchParams]);

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-invite', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: code }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        setIsCodeValid(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Code invalide');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const redirectToLastFm = () => {
    const apiKey = '5188e2c3d24f1e2a25fbf8ca2c35f620';
    const callbackUrl = `${window.location.origin}/api/auth/callback/lastfm`;
    const url = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(callbackUrl)}`;
    window.location.href = url;
  };

  return (
    <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '450px', border: '1px solid var(--glass-border)', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
      <h1 style={{ marginBottom: '1rem', fontSize: '3rem', fontWeight: 900, letterSpacing: '-1px', background: 'linear-gradient(135deg, #1DB954, #00c9ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Écho</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        {isCodeValid ? 'Code validé ! Authentification requise pour continuer.' : 'Entrez votre code d\'invitation pour accéder au Club Privé.'}
      </p>
      
      {error && <div style={{ color: '#ff4444', marginBottom: '1.5rem', fontSize: '0.9rem', background: 'rgba(255, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 68, 68, 0.2)' }}>{error}</div>}

      {!isCodeValid ? (
        <form onSubmit={verifyCode}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input 
              type="password" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              required 
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', outline: 'none', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '2px' }} 
              placeholder="CODE-INVIT"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: 'none', background: 'var(--accent-green)', color: 'black', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1, textTransform: 'uppercase', letterSpacing: '1px' }}
          >
            {loading ? 'Vérification...' : 'Vérifier le code'}
          </button>
        </form>
      ) : (
        <button 
          onClick={redirectToLastFm}
          style={{ 
            width: '100%', 
            padding: '1rem', 
            borderRadius: '12px', 
            border: 'none', 
            background: '#d51007',
            color: 'white', 
            fontWeight: 800, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(213, 16, 7, 0.3)'
          }}
        >
          <Music size={20} />
          Se connecter avec Last.fm
        </button>
      )}

      <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        Mode Club Privé — Accès restreint.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-primary)', padding: '20px' }}>
      <Suspense fallback={<div>Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
