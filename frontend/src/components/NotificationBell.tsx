import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { NotificationDTO } from '../types';
import { useWebSocket } from '../lib/useWebSocket';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get<{ count: number }>('/notifications/non-lues/count');
      setUnreadCount(res.data.count || 0);
    } catch {
      // Ignorer si déconnecté
    }
  };

  const fetchLatest = async () => {
    try {
      const res = await api.get<NotificationDTO[]>('/notifications');
      setNotifications(res.data.slice(0, 6));
    } catch {
      // Ignorer
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchLatest();

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen to live notifications via WebSocket
  useWebSocket({
    onNotification: (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev.slice(0, 5)]);
      setUnreadCount((prev) => prev + 1);
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const marquerLue = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/lire`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, estLue: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignorer
    }
  };

  const marquerToutesLues = async () => {
    try {
      await api.put('/notifications/lire-tout');
      setNotifications((prev) => prev.map((n) => ({ ...n, estLue: true })));
      setUnreadCount(0);
    } catch {
      // Ignorer
    }
  };

  const handleClickNotification = async (n: NotificationDTO) => {
    if (!n.estLue) {
      marquerLue(n.id);
    }
    setIsOpen(false);
    const target = n.lienRedirection || n.lienCible;
    if (target) {
      navigate(target);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchLatest();
        }}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-100 z-50 overflow-hidden animate-scale-up">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={marquerToutesLues}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition"
              >
                <Check className="w-3.5 h-3.5" /> Tout lire
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                Aucune notification pour le moment
              </div>
            ) : (
              notifications.map((n) => {
                const target = n.lienRedirection || n.lienCible;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className={`p-3.5 text-sm transition cursor-pointer flex items-start gap-3 group ${
                      !n.estLue
                        ? 'bg-blue-50/50 hover:bg-blue-100/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {!n.estLue ? (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-transparent shrink-0 mt-1.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-semibold text-xs truncate ${!n.estLue ? 'text-blue-950 font-bold' : 'text-slate-800'}`}>
                          {n.titre}
                        </span>
                        {target && (
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 transition" />
                        )}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                        <span>
                          {new Date(n.dateCreation).toLocaleDateString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        {target && (
                          <span className="text-blue-600 font-medium group-hover:underline">
                            Consulter →
                          </span>
                        )}
                      </div>
                    </div>

                    {!n.estLue && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          marquerLue(n.id);
                        }}
                        title="Marquer comme lue"
                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 p-1 rounded-lg transition shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 block py-1"
            >
              Voir toutes les notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
