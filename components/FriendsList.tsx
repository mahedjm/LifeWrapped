'use client';

import { UserPlus, UserMinus, Search, Loader2, Users, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function FriendsList({ onFriendClick, refreshKey }: { onFriendClick?: (id: string) => void, refreshKey?: number }) {
  const [friends, setFriends] = useState<{ id: string, username: string }[]>([]);
  const [newFriend, setNewFriend] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState<{id: string, username: string} | null>(null);

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/friends');
      const data = await res.json();
      if (data.friends) setFriends(data.friends);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();

    // Gestion du lien d'invitation (remplissage auto du champ)
    const urlParams = new URLSearchParams(window.location.search);
    const invite = urlParams.get('invite');
    if (invite) {
      setNewFriend(invite);
    }
  }, [refreshKey]);

  // Recherche de suggestions
  useEffect(() => {
    if (newFriend.length >= 3) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(newFriend)}`);
          const data = await res.json();
          if (data.users) {
            setSuggestions(data.users);
            setShowSuggestions(data.users.length > 0);
          }
        } catch (e) {
          console.error(e);
        }
      }, 300); // Debounce de 300ms
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [newFriend]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriend.trim()) return;
    
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newFriend.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setNewFriend('');
        setSuccess('Demande d\'ami envoyée avec succès !');
        setTimeout(() => setSuccess(null), 4000);
        fetchFriends();
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Erreur lors de l\'ajout');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendToDelete) return;
    try {
      await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: friendToDelete.id })
      });
      setFriendToDelete(null);
      fetchFriends();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="friends-list-container">
       <style jsx>{`
        .friends-list-container {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 30px;
          backdrop-filter: blur(20px);
          animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .add-friend-form {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
          align-items: center;
        }
        .input-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }
        input {
          width: 100%;
          height: 50px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          padding: 0 20px;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }
        @media (max-width: 600px) {
          .add-friend-form {
            flex-direction: row;
            gap: 10px;
          }
          .btn-add {
            width: 50px;
            height: 50px;
            padding: 0 !important;
            justify-content: center;
          }
          input {
            height: 50px;
            padding: 0 15px;
            font-size: 0.95rem;
          }
          .friends-list-container {
            padding: 20px 15px;
          }
          h2, h3 {
            text-align: center;
          }
          .section-title-wrapper {
            justify-content: center !important;
          }
        }
        input:focus {
          border-color: var(--accent-green);
          background: rgba(0, 0, 0, 0.4);
          box-shadow: 0 0 15px rgba(29, 185, 84, 0.1);
        }
        .suggestions-dropdown {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          right: 0;
          background: #121212;
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          overflow: hidden;
          z-index: 1000;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .suggestion-item {
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
        }
        .suggestion-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--accent-green);
        }
        .suggestion-avatar {
          width: 24px;
          height: 24px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 900;
        }
        .btn-add {
          height: 50px;
          background: var(--accent-green);
          color: black;
          border: none;
          border-radius: 14px;
          padding: 0 25px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
        }
        .btn-add:hover { 
          background: var(--accent-green-hover);
        }
        .btn-add:active { 
          transform: scale(0.96);
        }
        .btn-add:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .btn-share-invite {
          height: 50px;
          width: 50px;
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-share-invite:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .friends-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .friend-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
          cursor: pointer;
          gap: 15px;
        }
        .friend-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--accent-green);
          transform: translateY(-2px);
        }
        .friend-name {
          font-weight: 700;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .remove-btn {
          background: rgba(255, 68, 68, 0.05);
          color: #ff4444;
          border: 1px solid rgba(255, 68, 68, 0.1);
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .remove-btn:hover { 
          background: #ff4444; 
          color: white;
          transform: rotate(90deg);
        }
        .error-msg {
          background: rgba(255, 68, 68, 0.1);
          border: 1px solid rgba(255, 68, 68, 0.2);
          color: #ff4444;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 0.9rem;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .success-msg {
          background: rgba(30, 215, 96, 0.1);
          border: 1px solid rgba(30, 215, 96, 0.2);
          color: var(--accent-green);
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 0.9rem;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: fadeIn 0.3s ease;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease;
        }
        .confirm-modal {
          background: #121212;
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          padding: 30px;
          width: 90%;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 25px;
        }
        .btn-modal {
          flex: 1;
          height: 45px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .btn-cancel {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border: 1px solid var(--glass-border);
        }
        .btn-confirm-delete {
          background: #ff4444;
          color: white;
        }
        .btn-modal:hover { transform: translateY(-2px); opacity: 0.9; }
      `}</style>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '25px', color: 'white' }}>Gestion des Amis</h2>
      
      {error && <div className="error-msg"><Search size={16} /> {error}</div>}
      {success && <div className="success-msg"><UserPlus size={16} /> {success}</div>}

      <form className="add-friend-form" onSubmit={handleAddFriend}>
        <div className="input-wrapper">
          <input 
            type="text" 
            placeholder={loading ? "Chargement..." : "Chercher un utilisateur..."} 
            value={newFriend}
            onChange={(e) => setNewFriend(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => newFriend.length >= 3 && setShowSuggestions(true)}
          />
          {showSuggestions && (
            <div className="suggestions-dropdown">
              {suggestions.map(username => (
                <div 
                  key={username} 
                  className="suggestion-item"
                  onClick={() => {
                    setNewFriend(username);
                    setShowSuggestions(false);
                  }}
                >
                  <div className="suggestion-avatar">{username.charAt(0).toUpperCase()}</div>
                  <span>@{username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-add" type="submit" disabled={adding} title="Ajouter un ami">
            {adding ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
            <span className="desktop-only">Ajouter</span>
          </button>
          <button 
            type="button"
            className="btn-share-invite" 
            onClick={() => {
              const username = document.cookie.split('; ').find(row => row.startsWith('lastfm_username='))?.split('=')[1];
              const url = `${window.location.origin}/?invite=${username}`;
              navigator.clipboard.writeText(url);
              alert("Lien d'invitation copié dans le presse-papier !");
            }}
            title="Partager mon lien d'invitation"
          >
            <Share2 size={20} />
          </button>
        </div>
      </form>

      <div style={{ height: '1px', background: 'var(--glass-border)', margin: '40px 0' }} />

      <div className="section-title-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Vos Amis ({friends.length})</h3>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 className="animate-spin" size={40} color="var(--accent-green)" />
        </div>
      ) : friends.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          opacity: 0.5, 
          padding: '60px', 
          background: 'rgba(255,255,255,0.01)', 
          borderRadius: '20px',
          border: '1px dashed var(--glass-border)'
        }}>
          <Users size={40} style={{ marginBottom: '15px', opacity: 0.3 }} />
          <p>Vous n'avez pas encore d'amis sur Écho.</p>
          <p style={{ fontSize: '0.9rem' }}>Partagez votre dashboard pour inviter vos amis !</p>
        </div>
      ) : (
        <div className="friends-grid">
          {friends.map(friend => (
            <div key={friend.id} className="friend-card" onClick={() => onFriendClick?.(friend.id)}>
              <div className="friend-name">
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  background: 'var(--accent-green)', 
                  borderRadius: '50%', 
                  color: 'black', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 900
                }}>
                  {friend.username.charAt(0).toUpperCase()}
                </div>
                @{friend.username}
              </div>
              <button className="remove-btn" onClick={(e) => {
                e.stopPropagation();
                setFriendToDelete({ id: friend.id, username: friend.username });
              }} title="Retirer l'ami">
                <UserMinus size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmation */}
      {friendToDelete && (
        <div className="modal-overlay" onClick={() => setFriendToDelete(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: 'rgba(255, 68, 68, 0.1)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ff4444',
              margin: '0 auto 20px'
            }}>
              <UserMinus size={30} />
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.3rem' }}>Retirer l'ami ?</h3>
            <p style={{ opacity: 0.7, margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
              Voulez-vous vraiment retirer <strong>@{friendToDelete.username}</strong> de votre liste d'amis ?
            </p>
            <div className="modal-actions">
              <button className="btn-modal btn-cancel" onClick={() => setFriendToDelete(null)}>Annuler</button>
              <button className="btn-modal btn-confirm-delete" onClick={handleRemoveFriend}>Retirer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
