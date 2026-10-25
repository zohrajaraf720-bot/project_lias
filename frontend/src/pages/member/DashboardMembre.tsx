import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Calendar,
  Package,
  Layers,
  ArrowRight,
  PlusCircle,
  FileText,
  Clock,
  Sparkles,
  Building2,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { TableauBordMembreDTO, PublicationDTO, ReunionDTO, EvenementDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EquipeDashboardSection } from '../../components/EquipeDashboardSection';
import { ModalChangementEquipe } from '../../components/ModalChangementEquipe';

export const DashboardMembre: React.FC = () => {
  const { user, isChefEquipe } = useAuth();
  const [stats, setStats] = useState<TableauBordMembreDTO | null>(null);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [reunions, setReunions] = useState<ReunionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChangementEquipeModalOpen, setIsChangementEquipeModalOpen] = useState(false);

  useEffect(() => {
    const fetchMembreData = async () => {
      try {
        const [statsRes, pubRes, reuRes] = await Promise.all([
          api.get<TableauBordMembreDTO>('/dashboard/membre'),
          api.get<PublicationDTO[]>(`/publications/membre/${user?.id}`),
          api.get<ReunionDTO[]>('/reunions/mes-reunions'),
        ]);

        setStats(statsRes.data);
        setPublications(pubRes.data || []);
        setReunions(reuRes.data || []);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchMembreData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner text="Chargement de votre tableau de bord..." />;
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/20">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>
              {isChefEquipe ? `Chef d'Équipe • ${user?.equipeNom}` : `Membre Permanent • ${user?.equipeNom || 'LIAS'}`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Bonjour, Dr. {user?.prenom} {user?.nom}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Bienvenue sur votre portail de recherche du Laboratoire LIAS. Suivez la production de votre équipe, vos réunions d'axe et vos équipements.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/publications-gestion"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Déposer une Publication</span>
          </Link>
          <Link
            to="/evenements"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Proposer un Événement</span>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mes Publications</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.publications || 0}</div>
          <Link to="/publications-gestion" className="text-[11px] text-blue-600 font-semibold hover:underline mt-1 block">
            Articles & Références →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Réunions Programmées</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">{stats?.reunions || 0}</div>
          <Link to="/reunions" className="text-[11px] text-purple-600 font-semibold hover:underline mt-1 block">
            Voir mes réunions →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Demandes Matériel</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{stats?.demandesMateriel || 0}</div>
          <Link to="/mes-demandes-materiel" className="text-[11px] text-emerald-600 font-semibold hover:underline mt-1 block">
            Gérer les emprunts →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Événements Labo</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stats?.evenements || 0}</div>
          <Link to="/calendrier" className="text-[11px] text-amber-600 font-semibold hover:underline mt-1 block">
            Consulter l'agenda →
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent publications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm">Mes Dernières Publications Personnelles</h2>
            <Link to="/publications-gestion" className="text-xs font-bold text-blue-600 hover:underline">
              Gérer tout →
            </Link>
          </div>

          {publications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucune publication enregistrée pour l'instant.
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

        {/* Next meetings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm">Mes Prochaines Réunions</h2>
            <Link to="/reunions" className="text-xs font-bold text-purple-600 hover:underline">
              Planning complet →
            </Link>
          </div>

          {reunions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucune réunion planifiée pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {reunions.slice(0, 4).map((reu) => (
                <div key={reu.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{reu.titre}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(reu.dateHeure || (reu as any).dateReunion).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} • {reu.lieu}
                    </p>
                  </div>
                  <Link
                    to={`/reunions/${reu.id}`}
                    className="text-xs font-bold text-blue-600 hover:underline flex-shrink-0"
                  >
                    Détails
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Section (Encart Équipe, Statistiques de Production Scientifique, Membres & Doctorants) */}
      {user?.equipeId ? (
        <EquipeDashboardSection
          equipeId={user.equipeId}
          equipeNom={user.equipeNom}
          isChefEquipe={isChefEquipe}
        />
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
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
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto shrink-0"
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
