import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Notification } from '../../lib/types';
import { formatDistanceToNow } from 'date-fns';

interface TopbarProps {
  pageTitle: string;
  onMobileMenu?: () => void;
}

const TYPE_COLOR: Record<string, string> = {
  info: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export const Topbar: React.FC<TopbarProps> = ({ pageTitle, onMobileMenu }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15);
    if (data) setNotifications(data as Notification[]);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
  };

  const markAsRead = async (notifId: string) => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setNotifications(n => n.map(x => x.id === notifId ? { ...x, is_read: true } : x));
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? 'FS';

  return (
    <header className="app-topbar">
      <button className="topbar-toggle" onClick={onMobileMenu} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      <div className="topbar-breadcrumb">
        <strong>{pageTitle}</strong>
      </div>

      <div className="topbar-actions">
        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="topbar-icon-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
                    <RefreshCw size={12} /> Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 8).map(n => (
                  <div 
                    key={n.id} 
                    className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLOR[n.type] ?? '#64748B', marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-msg">{n.message}</div>
                        <div className="notif-item-time">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="user-menu-trigger">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-info-name">{user?.full_name || 'User'}</div>
            <div className="user-info-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
