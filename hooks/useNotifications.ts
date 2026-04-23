import { useState } from 'react';
import { Notification } from '@/lib/types';

export function useNotifications() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'Bienvenue sur Écho !', message: 'Découvrez vos statistiques musicales en temps réel.', date: 'Maintenant', read: false },
    { id: 2, title: 'Nouvelle mise à jour', message: 'Le système de notifications est arrivé.', date: 'Aujourd\'hui', read: false }
  ]);

  const markAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleNotifications = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState) {
      markAsRead();
    }
  };

  return {
    showNotifications,
    setShowNotifications,
    notifications,
    toggleNotifications
  };
}
