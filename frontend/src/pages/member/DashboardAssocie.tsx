import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Handshake,
  BookOpen,
  Calendar,
  Package,
  PlusCircle,
  Building,
  Building2,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { TableauBordMembreDTO, PublicationDTO, ConventionDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EquipeDashboardSection } from '../../components/EquipeDashboardSection';
import { ModalChangementEquipe } from '../../components/ModalChangementEquipe';

export const DashboardAssocie: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TableauBordMembreDTO | null>(null);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [conventions, setConventions] = useState<ConventionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChangementEquipeModalOpen, setIsChangementEquipeModalOpen] = useState(false);

  useEffect(() => {
    const fetchAssocieData = async () => {
      try {
        const [statsRes, pubRes, convRes] = await Promise.all([
          api.get<TableauBordMembreDTO>('/dashboard/membre'),
          api.get<PublicationDTO[]>(`/publications/membre/${user?.id}`),
          api.get<ConventionDTO[]>('/conventions'),
        ]);

        setStats(statsRes.data);
        setPublications(pubRes.data || []);
        setConventions(convRes.data || []);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchAssocieData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner text="Chargement de votre espace chercheur associé..." />;
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-blue-950 p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-400/20">
            <Handshake className="w-4 h-4 text-teal-300" />
            <span>Chercheur Associé • {user?.equipeNom || 'Partenariat Scientifique'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Espace Associé : {user?.prenom} {user?.nom}
          </h1>
          <p className="text-teal-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Consultez les conventions bilatérales, vos collaborations scientifiques avec les équipes du LIAS et déposez vos co-publications.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/publications-gestion"
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Déposer une Publication</span>
          </Link>
          <Link
            to="/conventions"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2"
          >
            <Building className="w-4 h-4" />
            <span>Voir les Conventions</span>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Co-Publications</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.publications || 0}</div>
          <Link to="/publications-gestion" className="text-[11px] text-blue-600 font-semibold hover:underline mt-1 block">
            Gérer les articles →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Conventions Actives</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Handshake className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-600 mt-2">{conventions.length}</div>
          <Link to="/conventions" className="text-[11px] text-teal-600 font-semibold hover:underline mt-1 block">
            Cadre partenarial →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Réunions Conjointes</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">{stats?.reunions || 0}</div>
          <Link to="/reunions" className="text-[11px] text-purple-600 font-semibold hover:underline mt-1 block">
            Planning réunions →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Emprunts Matériel</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{stats?.demandesMateriel || 0}</div>
          <Link to="/mes-demandes-materiel" className="text-[11px] text-emerald-600 font-semibold hover:underline mt-1 block">
            Mes emprunts →
          </Link>
        </div>
      </div>

      {/* Team Section for Associé */}
      {user?.equipeId ? (
        <EquipeDashboardSection
          equipeId={user.equipeId}
          equipeNom={user.equipeNom}
          isChefEquipe={false}
        />
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Aucune équipe de recherche rattachée</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                Vous n'êtes actuellement associé à aucune équipe de recherche spécifique. Vous pouvez demander un rattachement à une équipe scientifique du LIAS.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsChangementEquipeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto shrink-0"
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
