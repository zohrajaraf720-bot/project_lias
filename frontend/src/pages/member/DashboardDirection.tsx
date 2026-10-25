import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Layers,
  Activity,
  UserCheck,
  Package,
  FileText,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import api from '../../lib/api';
import { IndicateursDirectionDTO, EvenementDTO, DemandeAdhesionDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const DashboardDirection: React.FC = () => {
  const [stats, setStats] = useState<IndicateursDirectionDTO | null>(null);
  const [evenementsEnAttente, setEvenementsEnAttente] = useState<EvenementDTO[]>([]);
  const [adhesionsEnAttente, setAdhesionsEnAttente] = useState<DemandeAdhesionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, evRes, adhRes] = await Promise.all([
          api.get<IndicateursDirectionDTO>('/dashboard/direction'),
          api.get<EvenementDTO[]>('/evenements/a-valider'),
          api.get<DemandeAdhesionDTO[]>('/adhesions?statut=EN_ATTENTE'),
        ]);

        setStats(statsRes.data);
        const rawEv = evRes.data as any;
        setEvenementsEnAttente(Array.isArray(rawEv) ? rawEv : (rawEv?.contenu || []));
        const rawAdh = adhRes.data as any;
        setAdhesionsEnAttente(Array.isArray(rawAdh) ? rawAdh : (rawAdh?.contenu || []));
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Chargement du tableau de bord de direction..." />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/20">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Direction du Laboratoire LIAS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pilotage Stratégique & Gouvernance
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            Suivi des indicateurs scientifiques, validation des activités des équipes et gestion des adhésions au laboratoire.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/gouvernance/rapport-annuel"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Générer le Rapport Annuel</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Membres Actifs</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.totalMembres || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            dont {stats?.totalDoctorants || 0} doctorants
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Équipes de Recherche</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.totalEquipes || 0}</div>
          <Link to="/gouvernance/equipes" className="text-[11px] text-purple-600 font-semibold hover:underline mt-1 block">
            Gérer les équipes →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Publications Total</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.totalPublications || 0}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Production scientifique indexée
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Actions en Attente</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {(stats?.demandesAdhesionEnAttente || 0) + (evenementsEnAttente.length || 0)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Adhésions & validations
          </span>
        </div>
      </div>

      {/* Two Column Section for Urgent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Events Validation */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">
                Événements Scientifiques à Valider ({evenementsEnAttente.length})
              </h2>
            </div>
            <Link to="/gouvernance/evenements" className="text-xs font-bold text-blue-600 hover:underline">
              Gérer tout →
            </Link>
          </div>

          {evenementsEnAttente.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucun événement en attente de validation direction.
            </div>
          ) : (
            <div className="space-y-3">
              {evenementsEnAttente.slice(0, 4).map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3">
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-slate-900 truncate">{ev.titre}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {(ev.typeEvenement || ev.type || 'EVENEMENT').replace('_', ' ')} • Par {ev.organisateur?.prenom} {ev.organisateur?.nom}
                    </div>
                  </div>
                  <Link
                    to="/gouvernance/evenements"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition flex-shrink-0"
                  >
                    Examiner
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Applications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-slate-900 text-sm">
                Candidatures d'Adhésion ({adhesionsEnAttente.length})
              </h2>
            </div>
            <Link to="/gouvernance/adhesions" className="text-xs font-bold text-purple-600 hover:underline">
              Gérer tout →
            </Link>
          </div>

          {adhesionsEnAttente.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucun dossier d'adhésion en attente.
            </div>
          ) : (
            <div className="space-y-3">
              {adhesionsEnAttente.slice(0, 4).map((adh) => (
                <div key={adh.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3">
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {adh.prenom} {adh.nom}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Statut : {adh.typeSouhaite} {adh.equipeNom ? `• Équipe ${adh.equipeNom}` : ''}
                    </div>
                  </div>
                  <Link
                    to="/gouvernance/adhesions"
                    className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition flex-shrink-0"
                  >
                    Traiter
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
