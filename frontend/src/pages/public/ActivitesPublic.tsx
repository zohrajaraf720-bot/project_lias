import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, Tag } from 'lucide-react';
import api from '../../lib/api';
import { EvenementDTO, TypeEvenement, PageDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Pagination } from '../../components/Pagination';

export const ActivitesPublic: React.FC = () => {
  const [evenements, setEvenements] = useState<EvenementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string>('');
  const [page, setPage] = useState(0);

  const fetchEvenements = async (pageNumber: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNumber.toString());
      params.append('taille', '9');
      if (type) params.append('type', type);

      const res = await api.get<any>(`/public/evenements?${params.toString()}`);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw?.contenu || []);
      setEvenements(list);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvenements(0);
  }, [type]);

  // Client-side filtering ensures instant, accurate filtering
  const filteredEvenements = type
    ? evenements.filter((ev) => (ev.type || ev.typeEvenement) === type)
    : evenements;

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(filteredEvenements.length / pageSize));
  const paginatedEvenements = filteredEvenements.slice(page * pageSize, (page + 1) * pageSize);

  const eventTypes: { value: TypeEvenement | ''; label: string }[] = [
    { value: '', label: 'Tous les événements' },
    { value: 'SEMINAIRE', label: 'Séminaires de recherche' },
    { value: 'CONFERENCE', label: 'Conférences' },
    { value: 'WORKSHOP', label: 'Workshops & Ateliers' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Animation Scientifique</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Activités, Séminaires & Soutenances
        </h1>
        <p className="text-slate-600 text-sm">
          Retrouvez les événements académiques du laboratoire LIAS : présentations de doctorants, séminaires de professeurs invités et ateliers techniques.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {eventTypes.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setType(t.value);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              type === t.value
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner text="Chargement des événements..." />
      ) : filteredEvenements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">Aucun événement programmé dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedEvenements.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {(ev.typeEvenement || ev.type || 'EVENEMENT').replace('_', ' ')}
                    </span>
                    {ev.statut ? <StatusBadge status={ev.statut} /> : null}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                    {ev.titre}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span>{new Date(ev.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{ev.lieu || ev.edition || "Faculté des Sciences Ben M'Sik"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">
                    {ev.organisateur?.nom
                      ? `Organisé par ${ev.organisateur.prenom || ''} ${ev.organisateur.nom}`
                      : (ev.edition ? `Édition : ${ev.edition}` : 'Organisé par le laboratoire LIAS')}
                  </span>
                  <Link
                    to={`/evenements/${ev.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 flex-shrink-0"
                  >
                    <span>Détails</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={filteredEvenements.length}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      )}
    </div>
  );
};
