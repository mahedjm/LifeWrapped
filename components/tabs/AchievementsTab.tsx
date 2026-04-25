import React from 'react';
import BadgesSection from '@/components/BadgesSection';

interface AchievementsTabProps {
  badges: any;
}

export default function AchievementsTab({ badges }: AchievementsTabProps) {
  return (
    <div className="animated" style={{ animationDelay: '0.1s' }}>
      <BadgesSection badges={badges} />
    </div>
  );
}
