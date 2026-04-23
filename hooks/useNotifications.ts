import { useState, useEffect } from 'react';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
  from_user_id?: string;
  from_username?: string;
}

export function useNotifications() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir toutes les minutes
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    try {
      await fetch('/api/notifications', { method: 'POST' });
    } catch (e) {}
  };

  const toggleNotifications = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState) {
      markAsRead();
    }
  };

  const removeNotification = async (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch('/api/notifications', { 
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
    } catch (e) {}
  };

  const respondToFriendRequest = async (notificationId: number, action: 'accept' | 'decline') => {
    // Mise à jour optimiste : on enlève la notification immédiatement
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        body: JSON.stringify({ notificationId, action })
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      console.error(e);
      // En cas d'erreur, on pourrait rafraîchir pour faire réapparaître la notification
      fetchNotifications();
    }
    return false;
  };

  return { 
    showNotifications, 
    setShowNotifications, 
    notifications, 
    loading,
    toggleNotifications,
    removeNotification,
    respondToFriendRequest,
    refreshNotifications: fetchNotifications
  };
}
