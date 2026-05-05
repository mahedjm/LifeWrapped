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
      <FriendsActivity onFriendClick={(id) => setSelectedFriendId(id)} />
      <VibeMatchCard />
      <ClubAntenna />
      <FriendAchievements />
    </div>
  );
}
