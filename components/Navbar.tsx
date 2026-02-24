'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { LogOut, Briefcase, User, Menu, X, Bell } from 'lucide-react';
import { Button, cn } from '@/components/ui';

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: 'SEEKER' | 'PROVIDER';
  } | null;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount (when logged in)
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // non-critical
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // non-critical
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await fetch(`/api/notifications/${notification._id}`, { method: 'PATCH' });
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        // non-critical
      }
    }
    setBellOpen(false);
    if (notification.link) router.push(notification.link);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const dashboardHref =
    user?.role === 'SEEKER' ? '/dashboard/seeker' : '/dashboard/provider';

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs > 0) return `${hrs}h ago`;
    return 'Just now';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={user ? dashboardHref : '/'}
          className="flex items-center gap-2 font-bold text-xl text-zinc-900"
        >
          <Briefcase className="h-6 w-6 text-indigo-600" />
          <span>Skill<span className="text-indigo-600">Bridge</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-2">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-zinc-600 mr-1">
                <User className="h-4 w-4" />
                <span className="font-medium text-zinc-900">{user.name}</span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-100">
                  {user.role === 'SEEKER' ? 'Seeker' : 'Provider'}
                </span>
              </div>

              {/* Notification Bell */}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => {
                    setBellOpen(v => !v);
                    if (!bellOpen) fetchNotifications();
                  }}
                  className="relative rounded-md p-2 text-zinc-600 hover:bg-zinc-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-200 bg-white shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                      <span className="font-semibold text-zinc-900 text-sm">
                        Notifications
                        {unreadCount > 0 && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                            {unreadCount} new
                          </span>
                        )}
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <Bell className="h-8 w-8 text-zinc-200 mx-auto mb-2" />
                          <p className="text-sm text-zinc-400">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <button
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            className={cn(
                              'w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors',
                              !n.read && 'bg-indigo-50 hover:bg-indigo-100/60'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                'text-sm text-zinc-900 leading-snug',
                                !n.read && 'font-semibold'
                              )}>
                                {n.title}
                              </p>
                              {!n.read && (
                                <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
                className="gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden rounded-md p-2 text-zinc-600 hover:bg-zinc-100"
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-zinc-100 bg-white px-4 py-4 space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-zinc-600 pb-2 border-b border-zinc-100">
                <User className="h-4 w-4" />
                <span className="font-medium text-zinc-900">{user.name}</span>
                <span className="ml-auto rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-100">
                  {user.role === 'SEEKER' ? 'Seeker' : 'Provider'}
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {unreadCount} new notifications
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full">Sign in</Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">Get started</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
