import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, BookOpen, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import { EquipeDetailDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Avatar } from '../../components/Avatar';

export const EquipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [equipe, setEquipe] = useState<EquipeDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get<any>(`/public/equipes/${id}`);
        const data = res.data;
        if (data) {
          setEquipe({
            ...data,
            acronyme: data.acronyme || (data.nom ? data.nom.split(' ').map((w: string) => w[0]).join('').toUpperCase() : 'EQ'),
            chefEquipe: data.chefEquipe || data.chefActuel,
            axesRecherche: data.axesRecherche || data.thematiques || [],
            membres: data.membres || [],
            publications: data.publications || [],
          });
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Chargement de l'équipe..." />;
  }

  if (!equipe) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Équipe introuvable</h2>
        <Link to="/equipes" className="text-blue-600 text-sm mt-4 inline-block font-semibold">
          ← Retour aux équipes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <Link to="/equipes" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux équipes</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="px-4 py-2 rounded-2xl bg-blue-50 text-blue-700 font-black text-lg font-mono border border-blue-200">
            {equipe.acronyme}
          </span>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{equipe.membres?.length || 0} membres actifs</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {equipe.nom}
        </h1>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl">
          {equipe.description}
        </p>

        {/* Axes */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Axes de recherche & Thématiques
          </h2>
          <div className="flex flex-wrap gap-2">
            {equipe.axesRecherche?.map((axe, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-xl bg-blue-50/70 text-blue-800 text-xs font-semibold border border-blue-100"
              >
                {axe}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Team Leader & Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chef d'équipe Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Responsable de l'équipe</span>
          </div>
          {equipe.chefEquipe ? (
            <div className="flex items-center gap-4 pt-2">
              <Avatar
                src={equipe.chefEquipe.photo}
                alt={`${equipe.chefEquipe.prenom} ${equipe.chefEquipe.nom}`}
                size="xl"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {equipe.chefEquipe.prenom} {equipe.chefEquipe.nom}
                </h3>
                <p className="text-xs text-slate-500">{equipe.chefEquipe.email}</p>
                <span className="inline-block mt-2 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                  Chef d'équipe
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Aucun chef d'équipe mandaté actuellement.</p>
          )}
        </div>

        {/* Member Directory */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-base">Membres de l'équipe</h2>
            <span className="text-xs text-slate-400 font-semibold">{equipe.membres?.length} chercheurs</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {equipe.membres?.map((m) => (
              <div key={m.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
                <Avatar
                  src={m.photo}
                  alt={`${m.prenom} ${m.nom}`}
                  size="md"
                  rounded="rounded-xl"
                />
                <div className="overflow-hidden">
                  <div className="font-semibold text-xs text-slate-900 truncate">
                    {m.prenom} {m.nom}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{m.email}</div>
                  <span className="text-[10px] text-blue-600 font-medium">{m.statut}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Publications Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Publications de l'équipe</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {equipe.publications?.length || 0} articles
          </span>
        </div>

        <div className="space-y-4">
          {equipe.publications?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Aucune publication rattachée à cette équipe pour le moment.</p>
          ) : (
            equipe.publications?.map((pub) => (
              <div
                key={pub.id}
                className="p-4 rounded-xl border border-slate-200/70 hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                      {pub.annee}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm leading-snug">{pub.titre}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {pub.auteurs.map((a) => `${a.prenom} ${a.nom}`).join(', ')}
                  </p>
                </div>

                {pub.lienDoi && (
                  <a
                    href={pub.lienDoi.startsWith('http') ? pub.lienDoi : `https://doi.org/${pub.lienDoi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex-shrink-0"
                  >
                    <span>Consulter DOI</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
