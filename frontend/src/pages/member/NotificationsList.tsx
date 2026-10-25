import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  ExternalLink,
  CheckCheck,
  Calendar,
  Users,
  BookOpen,
  Package,
  Award,
  FileCheck,
  Handshake,
  UserPlus,
  ShieldAlert,
  Info,
} from 'lucide-react';
import api from '../../lib/api';
import { NotificationDTO, TypeNotification, PageDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Pagination } from '../../components/Pagination';
import { useToast } from '../../lib/toastContext';

const FILTER_TABS: { key: string; label: string }[] = [
  { key: '', label: 'Toutes' },
  { key: 'EVENEMENT', label: 'Événements' },
  { key: 'REUNION', label: 'Réunions' },
  { key: 'PUBLICATION', label: 'Publications' },
  { key: 'MATERIEL', label: 'Matériel' },
  { key: 'EQUIPE', label: 'Équipes' },
  { key: 'MANDAT', label: 'Mandats' },
  { key: 'RAPPORT', label: 'Rapports' },
  { key: 'CONVENTION', label: 'Conventions' },
  { key: 'DEMANDE_ADHESION', label: 'Adhésions' },
  { key: 'MEMBRE', label: 'Membres' },
];

const getTypeBadge = (type: TypeNotification | string) => {
  switch (type) {
    case 'EVENEMENT':
      return { label: 'Événement', icon: Calendar, className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'REUNION':
      return { label: 'Réunion', icon: Users, className: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'PUBLICATION':
      return { label: 'Publication', icon: BookOpen, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'MATERIEL':
      return { label: 'Matériel', icon: Package, className: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'EQUIPE':
      return { label: 'Équipe', icon: Users, className: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'MANDAT':
      return { label: 'Mandat', icon: Award, className: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'RAPPORT':
      return { label: 'Rapport Annuel', icon: FileCheck, className: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'CONVENTION':
      return { label: 'Convention', icon: Handshake, className: 'bg-teal-50 text-teal-700 border-teal-200' };
    case 'DEMANDE_ADHESION':
      return { label: 'Adhésion', icon: UserPlus, className: 'bg-green-50 text-green-700 border-green-200' };
    case 'MEMBRE':
      return { label: 'Membre', icon: Users, className: 'bg-violet-50 text-violet-700 border-violet-200' };
    case 'URGENT':
      return { label: 'Urgent', icon: ShieldAlert, className: 'bg-red-50 text-red-700 border-red-200' };
    default:
      return { label: type ? type.replace('_', ' ') : 'Info', icon: Info, className: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

export const NotificationsList: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string>('');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchNotifications = async (pageNumber: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNumber.toString());
      params.append('taille', '15');
      if (type) params.append('type', type);

      const res = await api.get<PageDTO<NotificationDTO>>(`/notifications/toutes?${params.toString()}`);
      setNotifications(res.data.contenu || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
      setPage(res.data.numeroPage ?? res.data.page ?? pageNumber);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(0);
  }, [type]);

  const handleMarquerLue = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/lire`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, estLue: true } : n))
      );
    } catch {
      // Ignorer
    }
  };

  const handleMarquerToutLu = async () => {
    try {
      await api.put('/notifications/lire-tout');
      setNotifications((prev) => prev.map((n) => ({ ...n, estLue: true })));
      success('Toutes les notifications ont été marquées comme lues.');
    } catch {
      // Ignorer
    }
  };

  const handleNotificationClick = (n: NotificationDTO) => {
    if (!n.estLue) {
      handleMarquerLue(n.id);
    }
    const target = n.lienRedirection || n.lienCible;
    if (target) {
      navigate(target);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Centre de Notifications
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Suivi complet de la vie du laboratoire : événements, réunions, matériel, équipes, mandats et publications.
          </p>
        </div>

        <button
          onClick={handleMarquerToutLu}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <CheckCheck className="w-4 h-4 text-blue-600" />
          <span>Tout marquer comme lu</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setType(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              type === tab.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner text="Chargement des notifications..." />
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h2 className="text-base font-bold text-slate-800">Aucune notification</h2>
          <p className="text-xs text-slate-500 mt-1">Votre boîte de réception est à jour.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const badge = getTypeBadge(n.type);
            const BadgeIcon = badge.icon;
            const target = n.lienRedirection || n.lienCible;

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 group ${
                  !n.estLue
                    ? 'bg-blue-50/50 border-blue-200 shadow-xs hover:border-blue-400 hover:bg-blue-50/80'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.className}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                    {!n.estLue && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white">
                        Nouveau
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {new Date(n.dateCreation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h3 className={`text-sm ${!n.estLue ? 'font-bold text-blue-950' : 'font-semibold text-slate-900'}`}>
                    {n.titre}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                  {target && (
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:underline pt-1">
                      <span>Consulter la page associée</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {!n.estLue && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarquerLue(n.id);
                    }}
                    title="Marquer comme lue"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 rounded-lg transition shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={(p) => {
              setPage(p);
              fetchNotifications(p);
            }}
          />
        </div>
      )}
    </div>
  );
};
