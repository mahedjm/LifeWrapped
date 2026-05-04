import React from 'react';
import FriendsList from '@/components/FriendsList';

interface FriendsTabProps {
  setSelectedFriendId: (id: string | null) => void;
  friendsRefreshKey: number;
  themeColor: string;
}

export default function FriendsTab({ setSelectedFriendId, friendsRefreshKey, themeColor }: FriendsTabProps) {
  return (
    <FriendsList 
      onFriendClick={(id) => setSelectedFriendId(id)} 
      refreshKey={friendsRefreshKey}
      themeColor={themeColor}
    />
  );
}
