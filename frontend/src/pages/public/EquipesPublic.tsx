import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Layers, ArrowRight, UserCheck } from 'lucide-react';
import api from '../../lib/api';
import { EquipeDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const EquipesPublic: React.FC = () => {
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEquipes = async () => {
      try {
        const res = await api.get<any>('/public/equipes');
        const data = res.data;
        setEquipes(Array.isArray(data) ? data : (data?.contenu || []));
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchEquipes();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Chargement des équipes de recherche..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Laboratoire LIAS</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Équipes de Recherche
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Le laboratoire rassemble des enseignants-chercheurs, des doctorants et des chercheurs associés répartis au sein d'équipes thématiques complémentaires.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {equipes.map((eq) => (
          <div
            key={eq.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs hover:shadow-lg transition flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-black text-sm font-mono border border-blue-200">
                  {eq.acronyme}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Users className="w-4 h-4 text-slate-400" />
                  {eq.nombreMembres} membres
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-snug">{eq.nom}</h2>

              <p className="text-xs text-slate-600 leading-relaxed">{eq.description}</p>

              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Axes prioritaires
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {eq.axesRecherche?.map((axe, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                    >
                      {axe}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-slate-700 font-semibold">
                  {eq.chefEquipe ? `${eq.chefEquipe.prenom} ${eq.chefEquipe.nom}` : 'Chef à désigner'}
                </span>
              </div>
              <Link
                to={`/equipes/${eq.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <span>Fiche équipe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
