import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Package,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const RechercheGlobale: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const q = queryParams.get('q') || '';

  const [resultats, setResultats] = useState<any>({
    membres: [],
    publications: [],
    evenements: [],
    documents: [],
    materiels: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const executeSearch = async () => {
      if (!q.trim()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(q.trim())}`);
        setResultats(res.data || {});
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    executeSearch();
  }, [q]);

  const totalResults =
    (resultats.membres?.length || 0) +
    (resultats.publications?.length || 0) +
    (resultats.evenements?.length || 0) +
    (resultats.documents?.length || 0) +
    (resultats.materiels?.length || 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Moteur de Recherche Transversal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Résultats pour "{q}"
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          {totalResults} résultat{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''} dans le système.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Recherche dans toutes les données du laboratoire..." />
      ) : totalResults === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h2 className="text-base font-bold text-slate-800">Aucun résultat trouvé</h2>
          <p className="text-xs text-slate-500 mt-1">
            Vérifiez l'orthographe de votre requête ou essayez d'autres mots-clés.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Members */}
          {resultats.membres?.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Membres du Laboratoire ({resultats.membres.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultats.membres.map((m: any) => (
                  <Link
                    key={m.id}
                    to={`/membres/${m.id}`}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/60 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{m.prenom} {m.nom}</div>
                      <div className="text-[11px] text-slate-400">{m.email} • {m.statut}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Publications */}
          {resultats.publications?.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Publications Scientifiques ({resultats.publications.length})</span>
              </div>
              <div className="space-y-3">
                {resultats.publications.map((pub: any) => (
                  <div key={pub.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {pub.annee}
                    </span>
                    <h4 className="font-bold text-xs text-slate-800 mt-1">{pub.titre}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {resultats.evenements?.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Événements & Séminaires ({resultats.evenements.length})</span>
              </div>
              <div className="space-y-3">
                {resultats.evenements.map((ev: any) => (
                  <Link
                    key={ev.id}
                    to={`/evenements/${ev.id}`}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-slate-200/60 transition block"
                  >
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {ev.typeEvenement}
                    </span>
                    <h4 className="font-bold text-xs text-slate-800 mt-1">{ev.titre}</h4>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {resultats.documents?.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Documents & Archives ({resultats.documents.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultats.documents.map((doc: any) => (
                  <div key={doc.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        {doc.typeDocument?.replace(/_/g, ' ') || 'DOCUMENT'}
                      </span>
                      <div className="font-bold text-xs text-slate-900 mt-1">{doc.titre}</div>
                    </div>
                    <Link
                      to="/documents"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      Consulter
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {resultats.materiels?.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
                <Package className="w-4 h-4 text-amber-600" />
                <span>Matériels & Équipements ({resultats.materiels.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultats.materiels.map((mat: any) => (
                  <div key={mat.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="font-bold text-xs text-slate-900">{mat.nom}</div>
                    <div className="text-[11px] text-slate-400">Réf : {mat.referenceInventaire} • Dispo : {mat.quantiteDisponible}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
