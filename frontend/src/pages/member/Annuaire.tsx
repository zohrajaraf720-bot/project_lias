import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Mail, ArrowRight, UserCheck, Filter } from 'lucide-react';
import api from '../../lib/api';
import { MembreInterneDTO, EquipeDTO, PageDTO, StatutMembre } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { Pagination } from '../../components/Pagination';

export const Annuaire: React.FC = () => {
  const [membres, setMembres] = useState<MembreInterneDTO[]>([]);
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [statut, setStatut] = useState<string>('');
  const [equipeId, setEquipeId] = useState<string>('');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchMembres = async (pageNumber: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNumber.toString());
      params.append('taille', '12');
      params.append('size', '12');
      if (query.trim()) params.append('q', query.trim());
      if (statut) params.append('statut', statut);
      if (equipeId) params.append('equipeId', equipeId);

      const res = await api.get<PageDTO<MembreInterneDTO>>(`/membres?${params.toString()}`);
      setMembres(res.data.contenu || []);
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
    api.get<EquipeDTO[]>('/equipes').then((res) => setEquipes(res.data || []));
    fetchMembres(0);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembres(0);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Annuaire des Membres du LIAS
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Consultez les coordonnées et profils scientifiques des enseignants-chercheurs, doctorants et chercheurs associés.
        </p>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, email, centre d'intérêt..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-700"
            >
              <option value="">Tous les statuts</option>
              <option value="PERMANENT">Enseignant-Chercheur Permanent</option>
              <option value="DOCTORANT">Doctorant</option>
              <option value="ASSOCIE">Chercheur Associé</option>
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
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-medium">
            {totalElements} membre{totalElements > 1 ? 's' : ''} répertorié{totalElements > 1 ? 's' : ''}
          </span>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
          >
            Filtrer
          </button>
        </div>
      </form>

      {/* Directory Grid */}
      {loading ? (
        <LoadingSpinner text="Recherche des membres en cours..." />
      ) : membres.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">Aucun membre ne correspond à vos critères</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {membres.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={m.photo}
                        alt={`${m.prenom} ${m.nom}`}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">
                          {m.prenom} {m.nom}
                        </h3>
                        <a
                          href={`mailto:${m.email}`}
                          className="text-[11px] text-slate-400 hover:text-blue-600 truncate block mt-0.5"
                        >
                          {m.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <StatusBadge status={m.statut} />
                    {m.equipeNom && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {m.equipeNom}
                      </span>
                    )}
                  </div>

                  {m.biographie && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">
                      {m.biographie}
                    </p>
                  )}

                  {m.centresInteret && m.centresInteret.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {m.centresInteret.slice(0, 3).map((interet, idx) => (
                        <span key={idx} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                          {interet}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {m.dateAffiliation ? `Depuis ${m.dateAffiliation}` : 'Laboratoire LIAS'}
                  </span>
                  <Link
                    to={`/membres/${m.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Profil & Travaux</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={(p) => {
              setPage(p);
              fetchMembres(p);
            }}
          />
        </div>
      )}
    </div>
  );
};
