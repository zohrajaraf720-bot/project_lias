import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  UserCheck,
  Bell,
  PlusCircle,
  ExternalLink,
  Building2,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { TableauBordMembreDTO, PublicationDTO, EvenementDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EquipeDashboardSection } from '../../components/EquipeDashboardSection';
import { ModalChangementEquipe } from '../../components/ModalChangementEquipe';

export const DashboardDoctorant: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TableauBordMembreDTO | null>(null);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [evenements, setEvenements] = useState<EvenementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChangementEquipeModalOpen, setIsChangementEquipeModalOpen] = useState(false);

  useEffect(() => {
    const fetchDoctorantData = async () => {
      try {
        const [statsRes, pubRes, evRes] = await Promise.all([
          api.get<TableauBordMembreDTO>('/dashboard/membre'),
          api.get<PublicationDTO[]>(`/publications/membre/${user?.id}`),
          api.get<any>('/public/evenements'),
        ]);

        setStats(statsRes.data);
        setPublications(pubRes.data || []);
        const rawEv = evRes.data;
        setEvenements(Array.isArray(rawEv) ? rawEv : (rawEv?.contenu || []));
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchDoctorantData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner text="Chargement de votre espace doctoral..." />;
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-semibold border border-purple-400/20">
            <GraduationCap className="w-4 h-4 text-purple-300" />
            <span>Doctorant-Chercheur • {user?.equipeNom || 'Laboratoire LIAS FSBM'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Espace Doctorat : {user?.prenom} {user?.nom}
          </h1>
          <p className="text-purple-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Bienvenue sur votre espace personnel. Ajoutez et consultez vos publications scientifiques, suivez l'agenda des soutenances de thèses et mettez à jour votre profil.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/publications-gestion"
            className="px-4 py-2.5 rounded-xl bg-white text-purple-950 font-bold text-xs shadow-md transition flex items-center gap-2 hover:bg-purple-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ajouter une Publication</span>
          </Link>
          <Link
            to="/calendrier"
            className="px-4 py-2.5 rounded-xl bg-purple-700/60 hover:bg-purple-700 text-white font-bold text-xs border border-purple-400/30 transition flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Agenda & Thèses</span>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mes Publications Référencées</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{publications.length}</div>
          <Link to="/publications-gestion" className="text-[11px] text-blue-600 font-semibold hover:underline mt-1 block">
            Gérer mes articles & DOIs →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Calendrier & Thèses</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">{evenements.length}</div>
          <Link to="/calendrier" className="text-[11px] text-purple-600 font-semibold hover:underline mt-1 block">
            Consulter le calendrier →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mon Profil Scientifique</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">Actif</div>
          <Link to="/profil" className="text-[11px] text-emerald-600 font-semibold hover:underline mt-1 block">
            Mettre à jour ma bio & thématiques →
          </Link>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent publications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm">Mes Publications Récentes</h2>
            <Link to="/publications-gestion" className="text-xs font-bold text-blue-600 hover:underline">
              Gérer →
            </Link>
          </div>

          {publications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucune publication enregistrée à votre nom pour l'instant.
            </div>
          ) : (
            <div className="space-y-3">
              {publications.slice(0, 4).map((pub) => (
                <div key={pub.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {pub.annee}
                  </span>
                  <h4 className="font-bold text-xs text-slate-800 mt-1 line-clamp-1">{pub.titre}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {pub.auteurs.map((a) => `${a.prenom} ${a.nom}`).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next academic events */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm">Séminaires & Soutenances du Laboratoire</h2>
            <Link to="/calendrier" className="text-xs font-bold text-purple-600 hover:underline">
              Voir tout l'agenda →
            </Link>
          </div>

          {evenements.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucun événement scientifique planifié.
            </div>
          ) : (
            <div className="space-y-3">
              {evenements.slice(0, 4).map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{ev.titre}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(ev.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} • {ev.lieu || 'En ligne'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                    {(ev.typeEvenement || ev.type || 'SEMINAIRE').replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Section for Doctorant */}
      {user?.equipeId ? (
        <EquipeDashboardSection
          equipeId={user.equipeId}
          equipeNom={user.equipeNom}
          isChefEquipe={false}
        />
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Aucune équipe de recherche rattachée</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                Vous n'êtes actuellement rattaché à aucune équipe du laboratoire LIAS. Vous pouvez déposer une demande d'affiliation pour intégrer une équipe.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsChangementEquipeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Rejoindre une équipe</span>
          </button>
        </div>
      )}

      {/* Modal Changement / Rattachement d'équipe */}
      <ModalChangementEquipe
        isOpen={isChangementEquipeModalOpen}
        onClose={() => setIsChangementEquipeModalOpen(false)}
      />
    </div>
  );
};
