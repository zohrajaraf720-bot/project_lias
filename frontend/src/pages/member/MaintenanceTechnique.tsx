import React, { useState } from 'react';
import {
  ShieldCheck,
  Trash2,
  Database,
  Server,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../lib/toastContext';

export const MaintenanceTechnique: React.FC = () => {
  const { success, error } = useToast();
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  const handlePurgeTokens = async () => {
    if (!window.confirm('Confirmez-vous la purge des jetons de sécurité expirés ou révoqués ?')) return;

    setPurging(true);
    setPurgeResult(null);
    try {
      const res = await api.post('/admin/maintenance', { action: 'PURGE_JETONS' });
      setPurgeResult(res.data.message || 'Purge effectuée avec succès.');
      success('Jetons expirés purgés de la base de données.');
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la purge.');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Opérations & Maintenance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Maintenance Technique & Sécurité
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Surveillance des composants système, purge des jetons de sécurité révoqués et intégrité de la base de données.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Serveur Backend Spring Boot</h3>
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> En ligne & Opérationnel
              </span>
            </div>
          </div>
          <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-400">Framework :</span>
              <span className="font-mono font-bold text-slate-800">Spring Boot 3.2.4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Java Runtime :</span>
              <span className="font-mono font-bold text-slate-800">JDK 23 / 17</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Authentification :</span>
              <span className="font-mono font-bold text-slate-800">JWT (jjwt 0.12.5)</span>
            </div>
          </div>
        </div>

        {/* Database Health */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Base de Données MySQL</h3>
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connectée (HikariCP)
              </span>
            </div>
          </div>
          <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-400">Moteur :</span>
              <span className="font-mono font-bold text-slate-800">MySQL 8.0 (UTF8MB4)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Verrous Distribués :</span>
              <span className="font-mono font-bold text-slate-800">ShedLock (Active)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stratégie d'Archivage :</span>
              <span className="font-mono font-bold text-slate-800">Soft Delete (@SQLRestriction)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Actions */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="font-bold text-slate-900 text-sm">Actions de Maintenance Immédiates</h2>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-purple-600" />
              <span>Purger les Jetons de Sécurité Expirés & Révoqués</span>
            </div>
            <p className="text-slate-500 text-xs">
              Supprime physiquement de la table <code className="text-purple-600 font-mono">jetons_securite</code> les tokens obsolètes (déconnexions, réinitialisations de MDP).
            </p>
          </div>

          <button
            onClick={handlePurgeTokens}
            disabled={purging}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${purging ? 'animate-spin' : ''}`} />
            <span>{purging ? 'Purge...' : 'Exécuter la Purge'}</span>
          </button>
        </div>

        {purgeResult && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{purgeResult}</span>
          </div>
        )}
      </div>
    </div>
  );
};
