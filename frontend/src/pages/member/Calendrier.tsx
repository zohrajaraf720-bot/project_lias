import React, { useEffect, useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Video,
  GraduationCap,
  Users,
  Presentation,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import api from '../../lib/api';
import { EvenementDTO, ReunionDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';

interface CategoryStyle {
  label: string;
  shortLabel: string;
  badgeClass: string;
  cardClass: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  SOUTENANCE_THESE: {
    label: 'Soutenance de Thèse',
    shortLabel: 'Thèse',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    cardClass: 'bg-purple-50/90 border-purple-200 text-purple-950 border-l-4 border-l-purple-600 hover:bg-purple-100',
    dotColor: '#9333ea',
    icon: GraduationCap,
  },
  CONFERENCE: {
    label: 'Conférence',
    shortLabel: 'Conférence',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    cardClass: 'bg-blue-50/90 border-blue-200 text-blue-950 border-l-4 border-l-blue-600 hover:bg-blue-100',
    dotColor: '#2563eb',
    icon: Presentation,
  },
  SEMINAIRE: {
    label: 'Séminaire',
    shortLabel: 'Séminaire',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    cardClass: 'bg-sky-50/90 border-sky-200 text-sky-950 border-l-4 border-l-sky-600 hover:bg-sky-100',
    dotColor: '#0284c7',
    icon: BookOpen,
  },
  WORKSHOP: {
    label: 'Workshop',
    shortLabel: 'Workshop',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
    cardClass: 'bg-teal-50/90 border-teal-200 text-teal-950 border-l-4 border-l-teal-600 hover:bg-teal-100',
    dotColor: '#0d9488',
    icon: Sparkles,
  },
  ATELIER: {
    label: 'Atelier',
    shortLabel: 'Atelier',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cardClass: 'bg-emerald-50/90 border-emerald-200 text-emerald-950 border-l-4 border-l-emerald-600 hover:bg-emerald-100',
    dotColor: '#059669',
    icon: Sparkles,
  },
  JOURNEE_ETUDE: {
    label: 'Journée d\'étude',
    shortLabel: 'Journée',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    cardClass: 'bg-amber-50/90 border-amber-200 text-amber-950 border-l-4 border-l-amber-600 hover:bg-amber-100',
    dotColor: '#d97706',
    icon: CalendarIcon,
  },
  REUNION: {
    label: 'Réunion d\'équipe',
    shortLabel: 'Réunion',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    cardClass: 'bg-slate-100/90 border-slate-200 text-slate-900 border-l-4 border-l-slate-600 hover:bg-slate-200/80',
    dotColor: '#475569',
    icon: Users,
  },
};

const getCategoryConfig = (categoryKey?: string): CategoryStyle => {
  if (!categoryKey) return CATEGORY_STYLES.CONFERENCE;
  return CATEGORY_STYLES[categoryKey] || {
    label: categoryKey.replace('_', ' '),
    shortLabel: categoryKey.replace('_', ' '),
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    cardClass: 'bg-blue-50/90 border-blue-200 text-blue-950 border-l-4 border-l-blue-600 hover:bg-blue-100',
    dotColor: '#2563eb',
    icon: CalendarIcon,
  };
};

interface CalendarEventItem {
  id: string;
  title: string;
  start: string;
  end?: string;
  category: string;
  extendedProps: {
    type: 'EVENEMENT' | 'REUNION';
    category: string;
    rawTitle: string;
    lieu?: string;
    description?: string;
    lienWebinaire?: string;
  };
}

const FILTER_TABS = [
  { key: 'ALL', label: 'Tous les événements' },
  { key: 'SOUTENANCE_THESE', label: 'Soutenances' },
  { key: 'CONFERENCE', label: 'Conférences' },
  { key: 'SEMINAIRE', label: 'Séminaires' },
  { key: 'ATELIER', label: 'Ateliers & Workshops' },
  { key: 'REUNION', label: 'Réunions' },
];

export const Calendrier: React.FC = () => {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const [evRes, reuRes] = await Promise.all([
          api.get<{ contenu: EvenementDTO[] }>('/evenements?taille=100'),
          api.get<ReunionDTO[]>('/reunions/mes-reunions'),
        ]);

        const evItems: CalendarEventItem[] = (evRes.data?.contenu || []).map((ev) => {
          const cat = (ev.typeEvenement || ev.type || 'CONFERENCE') as string;

          return {
            id: `ev-${ev.id}`,
            title: ev.titre,
            start: ev.dateDebut,
            end: ev.dateFin,
            category: cat,
            extendedProps: {
              type: 'EVENEMENT',
              category: cat,
              rawTitle: ev.titre,
              lieu: ev.lieu,
              description: ev.description,
              lienWebinaire: ev.lienWebinaire,
            },
          };
        });

        const reuItems: CalendarEventItem[] = (reuRes.data || []).map((reu) => ({
          id: `reu-${reu.id}`,
          title: reu.titre,
          start: reu.dateHeure || (reu as any).dateReunion,
          category: 'REUNION',
          extendedProps: {
            type: 'REUNION',
            category: 'REUNION',
            rawTitle: reu.titre,
            lieu: reu.lieu,
            description: reu.ordreDuJour,
          },
        }));

        setEvents([...evItems, ...reuItems]);
      } catch {
        // Fallback silencieux
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'ALL') return events;
    if (activeFilter === 'ATELIER') {
      return events.filter((e) => e.category === 'ATELIER' || e.category === 'WORKSHOP');
    }
    return events.filter((e) => e.category === activeFilter);
  }, [events, activeFilter]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: events.length };
    events.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + 1;
      if (e.category === 'ATELIER' || e.category === 'WORKSHOP') {
        map['ATELIER'] = (map['ATELIER'] || 0) + 1;
      }
    });
    return map;
  }, [events]);

  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo;
    const props = event.extendedProps;
    const config = getCategoryConfig(props.category);

    let timeStr = '';
    if (event.start) {
      const d = new Date(event.start);
      timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    return (
      <div
        className={`w-full min-w-0 p-1.5 sm:p-2 rounded-xl border text-left cursor-pointer transition shadow-2xs hover:shadow-xs overflow-hidden flex flex-col gap-0.5 ${config.cardClass}`}
        title={`${props.rawTitle || event.title}${props.lieu ? ' — ' + props.lieu : ''}`}
      >
        <div className="flex items-center justify-between gap-1 w-full min-w-0">
          <span
            className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 border ${config.badgeClass}`}
          >
            {config.shortLabel}
          </span>
          {timeStr && (
            <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap shrink-0">
              {timeStr}
            </span>
          )}
        </div>

        <p className="text-xs font-bold text-slate-900 truncate w-full leading-tight">
          {props.rawTitle || event.title}
        </p>

        {props.lieu && (
          <span className="text-[10px] text-slate-600 truncate flex items-center gap-1 font-medium">
            <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
            <span className="truncate">{props.lieu}</span>
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Chargement du calendrier du laboratoire..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Calendrier Académique & Thèses
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Planning unifié des soutenances de thèses, conférences internationales et séminaires de recherche.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span className="text-slate-600 font-semibold text-[11px]">Soutenances</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-slate-600 font-semibold text-[11px]">Conférences</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
            <span className="text-slate-600 font-semibold text-[11px]">Séminaires</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
            <span className="text-slate-600 font-semibold text-[11px]">Ateliers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span className="text-slate-600 font-semibold text-[11px]">Réunions</span>
          </div>
        </div>
      </div>

      {/* Interactive Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const count = categoryCounts[tab.key] || 0;
          const isActive = activeFilter === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600/20'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modern Calendar Container */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs custom-calendar">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale={frLocale}
          events={filteredEvents}
          dayMaxEvents={3}
          moreLinkContent={(args) => `+${args.num} autres`}
          eventClick={(info) => {
            const ev = events.find((e) => e.id === info.event.id);
            if (ev) setSelectedEvent(ev);
          }}
          eventContent={renderEventContent}
          height="auto"
        />
      </div>

      {/* Event Click Details Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.extendedProps.rawTitle || selectedEvent?.title || 'Détails de l\'événement'}
        maxWidth="lg"
      >
        {selectedEvent && (() => {
          const config = getCategoryConfig(selectedEvent.extendedProps.category);
          const Icon = config.icon || CalendarIcon;

          return (
            <div className="space-y-5 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${config.badgeClass}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{config.label}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Date & Heure
                    </span>
                    <span className="text-slate-800 font-semibold leading-relaxed">
                      {new Date(selectedEvent.start).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {selectedEvent.end && (
                        <>
                          <br />
                          <span className="text-slate-500 font-normal">
                            Jusqu'au{' '}
                            {new Date(selectedEvent.end).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {selectedEvent.extendedProps.lieu ? (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Lieu
                      </span>
                      <span className="text-slate-800 font-semibold">{selectedEvent.extendedProps.lieu}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Lieu
                      </span>
                      <span className="text-slate-500">Non spécifié (LIAS FSBM)</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedEvent.extendedProps.description && (
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Description & Ordre du jour
                  </span>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 leading-relaxed text-slate-700 whitespace-pre-line shadow-xs">
                    {selectedEvent.extendedProps.description}
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.lienWebinaire && (
                <div className="pt-2">
                  <a
                    href={selectedEvent.extendedProps.lienWebinaire}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold transition hover:bg-blue-700 shadow-md shadow-blue-500/20"
                  >
                    <Video className="w-4 h-4" />
                    <span>Rejoindre la visioconférence</span>
                  </a>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
