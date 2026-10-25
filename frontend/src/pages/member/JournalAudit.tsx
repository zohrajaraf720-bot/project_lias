import React, { useEffect, useState } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Lock,
} from 'lucide-react';
import api from '../../lib/api';
import { TraceAuditDTO, PageDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Pagination } from '../../components/Pagination';

export const JournalAudit: React.FC = () => {
  const [traces, setTraces] = useState<TraceAuditDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailFilter, setEmailFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchAudit = async (pageNumber: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNumber.toString());
      params.append('taille', '15');
      if (emailFilter.trim()) params.append('email', emailFilter.trim());
      if (actionFilter.trim()) params.append('action', actionFilter.trim());

      const res = await api.get<any>(`/admin/audit?${params.toString()}`);
      const raw = res.data;
      setTraces(raw?.contenu || raw?.content || []);
      setTotalPages(raw?.totalPages || 1);
      setTotalElements(raw?.totalElements || 0);
      setPage(raw?.numeroPage ?? raw?.page ?? raw?.number ?? pageNumber);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit(0);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Traçabilité & Sécurité Immuable</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Journal d'Audit Système
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Historique inaltérable des opérations sensibles, connexions, validations directionnelles et purges de sécurité.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <input
          type="text"
          placeholder="Filtrer par email utilisateur..."
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          className="w-full sm:w-72 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
        />
        <input
          type="text"
          placeholder="Filtrer par action (ex: CONNEXION, VALIDATION)..."
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full sm:w-72 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
        />
        <button
          onClick={() => fetchAudit(0)}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
        >
          Filtrer
        </button>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <LoadingSpinner text="Chargement du journal d'audit..." />
      ) : traces.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
          <History className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">Aucune trace d'audit trouvée</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Horodatage</th>
                  <th className="px-6 py-3.5">Utilisateur</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Entité Affectée</th>
                  <th className="px-6 py-3.5">Adresse IP</th>
                  <th className="px-6 py-3.5">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {traces.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(t.dateAction).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {t.utilisateurEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold font-mono text-[10px]">
                        {t.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      {t.entiteAffectee} {t.entiteId ? `#${t.entiteId}` : ''}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400 whitespace-nowrap">
                      {t.adresseIp || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {t.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={(p) => {
                setPage(p);
                fetchAudit(p);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
