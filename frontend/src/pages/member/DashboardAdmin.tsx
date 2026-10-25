import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Settings,
  History,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  ArrowRight,
  Layers,
  Award,
  FileText,
  Package,
  UserCheck,
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../lib/toastContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const DashboardAdmin: React.FC = () => {
  const [stats, setStats] = useState({
    totalComptes: 0,
    actifs: 0,
    geles: 0,
    desactives: 0,
  });
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get<{ contenu: any[] }>('/membres?taille=100');
        const membres = res.data.contenu || [];
        setStats({
          totalComptes: membres.length,
          actifs: membres.filter((m) => m.etatCompte === 'ACTIF').length,
          geles: membres.filter((m) => m.etatCompte === 'GELE').length,
          desactives: membres.filter((m) => m.etatCompte === 'DESACTIVE').length,
        });
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  const handlePurgeTokens = async () => {
    if (!window.confirm('Voulez-vous purger immédiatement tous les jetons de sécurité expirés ou révoqués ?')) {
      return;
    }
    setPurging(true);
    try {
      const res = await api.post('/admin/maintenance', { action: 'PURGE_JETONS' });
      success(res.data.message || 'Purge des jetons réussie.');
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la purge.');
    } finally {
      setPurging(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement de l'administration système..." />;
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-slate-900 to-slate-950 p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-400/20">
            <Settings className="w-4 h-4 text-purple-400" />
            <span>Console Système Administrateur</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Administration & Surveillance
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            Gestion des comptes, intégrité des données, traçabilité des opérations sensibles et maintenance technique.
          </p>
        </div>

        <button
          onClick={handlePurgeTokens}
          disabled={purging}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          <span>{purging ? 'Purge en cours...' : 'Purger Jetons Expirés'}</span>
        </button>
      </div>

      {/* Account stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Comptes</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.totalComptes}</div>
          <Link to="/admin/comptes" className="text-[11px] text-blue-600 font-semibold hover:underline mt-1 block">
            Gérer les utilisateurs →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Comptes Actifs</div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{stats.actifs}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Accès autorisé</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Comptes Gelés (Retraités)</div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stats.geles}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Consultation seule</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Comptes Désactivés</div>
          <div className="text-2xl font-black text-red-600 mt-2">{stats.desactives}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Départs du laboratoire</span>
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/comptes"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 transition group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Gestion des Comptes</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Activation, réinitialisation de mot de passe, changement d'état (Actif, Gelé, Désactivé) et réactivation.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
            Accéder aux comptes <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          to="/admin/parametres"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-400 transition group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Paramétrage du Laboratoire</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Coordonnées institutionnelles, affiliation université/faculté, email de contact et description publique.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600">
            Configurer le labo <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          to="/admin/audit"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-400 transition group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
            <History className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Journal d'Audit Sécurisé</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Consultation immuable des traces de sécurité, connexions, modifications de statuts et purges système.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            Voir le journal d'audit <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      {/* Governance & Operations Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Gouvernance & Gestion Intégrale du Laboratoire</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/gouvernance/equipes"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-sm transition group text-center space-y-2"
          >
            <div className="w-9 h-9 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-800">Équipes</div>
            <div className="text-[10px] text-slate-400">Mobilité & Chefs</div>
          </Link>

          <Link
            to="/gouvernance/mandats"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-sm transition group text-center space-y-2"
          >
            <div className="w-9 h-9 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-800">Mandats</div>
            <div className="text-[10px] text-slate-400">Attribution & Rôles</div>
          </Link>

          <Link
            to="/gouvernance/adhesions"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-sm transition group text-center space-y-2"
          >
            <div className="w-9 h-9 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-800">Adhésions</div>
            <div className="text-[10px] text-slate-400">Candidatures</div>
          </Link>

          <Link
            to="/gouvernance/materiel"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-sm transition group text-center space-y-2"
          >
            <div className="w-9 h-9 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Package className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-800">Matériel</div>
            <div className="text-[10px] text-slate-400">Attributions & Stock</div>
          </Link>

          <Link
            to="/gouvernance/rapport-annuel"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-sm transition group text-center space-y-2"
          >
            <div className="w-9 h-9 mx-auto rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-800">Rapport Annuel</div>
            <div className="text-[10px] text-slate-400">Génération PDF</div>
          </Link>

          <Link
            to="/gouvernance/departs"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-sm transition group text-center space-y-2"
          >
            <div className="w-9 h-9 mx-auto rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition">
              <History className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-800">Départs</div>
            <div className="text-[10px] text-slate-400">Retraites & Fins</div>
          </Link>
        </div>
      </div>
    </div>
  );
};
