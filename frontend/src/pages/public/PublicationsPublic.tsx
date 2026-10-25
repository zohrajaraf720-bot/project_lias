import React, { useEffect, useState } from 'react';
import { Search, BookOpen, ExternalLink, Filter, Calendar } from 'lucide-react';
import api from '../../lib/api';
import { PublicationDTO, EquipeDTO, PageDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Pagination } from '../../components/Pagination';
import { PUBLICATION_TYPES, getPublicationTypeLabel } from '../member/PublicationsList';

export const PublicationsPublic: React.FC = () => {
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [chercheurs, setChercheurs] = useState<{ id: number; nom: string; prenom: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [query, setQuery] = useState('');
  const [annee, setAnnee] = useState<string>('');
  const [typePub, setTypePub] = useState<string>('');
  const [equipeId, setEquipeId] = useState<string>('');
  const [auteurId, setAuteurId] = useState<string>('');

  const fetchPublications = async (pageNumber: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNumber.toString());
      params.append('taille', '10');
      if (query.trim()) params.append('q', query.trim());
      if (annee) params.append('annee', annee);
      if (typePub) params.append('type', typePub);
      if (equipeId) params.append('equipeId', equipeId);
      if (auteurId) params.append('auteurId', auteurId);

      const res = await api.get<PageDTO<PublicationDTO>>(`/public/publications?${params.toString()}`);
      setPublications(res.data.contenu || []);
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
    // Load teams and researchers for filters
    api.get<EquipeDTO[]>('/public/equipes').then((res) => setEquipes(res.data || [])).catch(() => {});
    api.get<{ id: number; nom: string; prenom: string }[]>('/public/chercheurs').then((res) => setChercheurs(res.data || [])).catch(() => {});
    fetchPublications(0);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPublications(0);
  };

  const years = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Production Scientifique</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Publications du Laboratoire LIAS
        </h1>
        <p className="text-slate-600 text-sm">
          Articles dans revues internationales indexées (Scopus, WoS), actes de conférences internationales et chapitres d'ouvrages.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Titre, mots-clés, résumé..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <select
              value={typePub}
              onChange={(e) => setTypePub(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-700"
            >
              <option value="">Tous les types</option>
              {PUBLICATION_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-700"
            >
              <option value="">Toutes les années</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  Année {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={equipeId}
              onChange={(e) => setEquipeId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-700"
            >
              <option value="">Toutes les équipes</option>
              {equipes.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.acronyme} - {eq.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={auteurId}
              onChange={(e) => setAuteurId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-700"
            >
              <option value="">Tous les chercheurs</option>
              {chercheurs.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.prenom} {ch.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-medium">
            {totalElements} résultat{totalElements > 1 ? 's' : ''} trouvé{totalElements > 1 ? 's' : ''}
          </span>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
          >
            Filtrer
          </button>
        </div>
      </form>

      {/* Publications List */}
      {loading ? (
        <LoadingSpinner text="Chargement des publications..." />
      ) : publications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">Aucune publication trouvée</p>
          <p className="text-xs mt-1">Modifiez vos critères de recherche pour afficher les travaux du laboratoire.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-start justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                    {pub.annee}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                    {getPublicationTypeLabel(pub.type)}
                  </span>
                  {pub.equipeNom && (
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      Équipe {pub.equipeNom}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {pub.titre}
                </h3>

                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Auteurs : </span>
                  {pub.auteurs.map((a) => `${a.prenom} ${a.nom}`).join(', ')}
                  {pub.coAuteursExternes && pub.coAuteursExternes.length > 0 && `, ${pub.coAuteursExternes.join(', ')}`}
                </p>

                {pub.resume && (
                  <p className="text-xs text-slate-500 leading-relaxed pt-1 line-clamp-3">
                    {pub.resume}
                  </p>
                )}
              </div>

              {pub.lienDoi && (
                <a
                  href={pub.lienDoi.startsWith('http') ? pub.lienDoi : `https://doi.org/${pub.lienDoi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition flex-shrink-0"
                >
                  <span>Accéder à l'article (DOI)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={(p) => {
              setPage(p);
              fetchPublications(p);
            }}
          />
        </div>
      )}
    </div>
  );
};
