import React from 'react';
import FriendsList from '@/components/FriendsList';

interface FriendsTabProps {
  setSelectedFriendId: (id: string | null) => void;
  friendsRefreshKey: number;
}

export default function FriendsTab({ setSelectedFriendId, friendsRefreshKey }: FriendsTabProps) {
  return (
    <FriendsList 
      onFriendClick={(id) => setSelectedFriendId(id)} 
      refreshKey={friendsRefreshKey} 
    />
  );
}
