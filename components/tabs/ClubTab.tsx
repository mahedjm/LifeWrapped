import React from 'react';
import { Zap } from 'lucide-react';
import ClubAntenna from '@/components/ClubAntenna';
import FriendAchievements from '@/components/FriendAchievements';
import VibeMatchCard from '@/components/VibeMatchCard';
import FriendsActivity from '@/components/FriendsActivity';

interface ClubTabProps {
  setSelectedFriendId: (id: string | null) => void;
}

export default function ClubTab({ setSelectedFriendId }: ClubTabProps) {
  return (
    <div>
      <div className="section-badge-container" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
          padding: '8px 24px',
          borderRadius: '50px',
          border: '1px solid color-mix(in srgb, var(--accent-green), transparent 80%)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <Zap size={18} color="var(--accent-green)" />
          <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Le Club
          </h2>
        </div>
      </div>
      <ClubAntenna />
      <FriendAchievements />
      <VibeMatchCard />
      <FriendsActivity onFriendClick={(id) => setSelectedFriendId(id)} />
    </div>
  );
}
