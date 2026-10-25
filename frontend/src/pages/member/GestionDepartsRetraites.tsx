import React, { useEffect, useState } from 'react';
import {
  History,
  Users,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import api from '../../lib/api';
import { MembreInterneDTO, EtatCompte } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toastContext';

export const GestionDepartsRetraites: React.FC = () => {
  const { success, error } = useToast();

  const [membres, setMembres] = useState<MembreInterneDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Action Modal State
  const [selectedMembre, setSelectedMembre] = useState<MembreInterneDTO | null>(null);
  const [actionType, setActionType] = useState<'RETRAITE' | 'DEPART' | null>(null);
  const [dateEffective, setDateEffective] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const fetchMembres = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ contenu: MembreInterneDTO[] }>('/membres?taille=100');
      setMembres(res.data?.contenu || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembres();
  }, []);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMembre || !actionType) return;

    setSaving(true);
    try {
      if (actionType === 'RETRAITE') {
        await api.put(`/membres/${selectedMembre.id}/retraite`, {
          dateRetraite: dateEffective,
        });
        success(`Le membre ${selectedMembre.prenom} ${selectedMembre.nom} a été mis à la retraite. Son compte est désormais gelé.`);
      } else {
        await api.put(`/membres/${selectedMembre.id}/depart`, {
          dateDepart: dateEffective,
        });
        success(`Le départ de ${selectedMembre.prenom} ${selectedMembre.nom} a été acté. Son compte a été désactivé.`);
      }

      setSelectedMembre(null);
      setActionType(null);
      fetchMembres();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de l'enregistrement de l'opération.");
    } finally {
      setSaving(false);
    }
  };

  const handleReactiver = async (m: MembreInterneDTO) => {
    if (!window.confirm(`Voulez-vous réactiver le compte de ${m.prenom} ${m.nom} ?`)) return;

    try {
      await api.put(`/membres/${m.id}/reactiver`);
      success(`Le compte de ${m.prenom} ${m.nom} a été réactivé avec succès !`);
      fetchMembres();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la réactivation.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement de la liste des membres..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Gestion des Sorties & Retraites</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Gestion des Départs & Mises à la Retraite
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Application stricte des règles de gestion LIAS : clôture des mandats, révocation des jetons de sécurité et gel ou désactivation des comptes.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 text-sm">Effectif des Membres & État des Comptes</h2>

        <div className="space-y-3">
          {membres.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {m.prenom} {m.nom}
                  </h3>
                  <StatusBadge status={m.statut} />
                  <StatusBadge status={m.etatCompte} />
                </div>
                <div className="text-xs text-slate-500">
                  {m.email} {m.equipeNom ? `• Équipe ${m.equipeNom}` : ''}
                </div>
              </div>

              {/* Action buttons based on current state */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {m.etatCompte === 'ACTIF' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedMembre(m);
                        setActionType('RETRAITE');
                        setDateEffective(new Date().toISOString().split('T')[0]);
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition"
                    >
                      Mise à la retraite (Gel)
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMembre(m);
                        setActionType('DEPART');
                        setDateEffective(new Date().toISOString().split('T')[0]);
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-red-300 bg-red-50 text-red-800 hover:bg-red-100 text-xs font-bold transition"
                    >
                      Départ (Désactiver)
                    </button>
                  </>
                )}

                {m.etatCompte === 'DESACTIVE' && (
                  <button
                    onClick={() => handleReactiver(m)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réactiver le compte</span>
                  </button>
                )}

                {m.etatCompte === 'GELE' && (
                  <span className="text-[11px] font-semibold text-slate-400 italic">
                    Compte gelé définitivement
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!selectedMembre && !!actionType}
        onClose={() => {
          setSelectedMembre(null);
          setActionType(null);
        }}
        title={actionType === 'RETRAITE' ? 'Mettre le Membre à la Retraite' : 'Enregistrer le Départ du Membre'}
        maxWidth="md"
      >
        {selectedMembre && actionType && (
          <form onSubmit={handleExecuteAction} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 block font-semibold mb-1">Membre concerné :</span>
              <p className="font-bold text-slate-900">
                {selectedMembre.prenom} {selectedMembre.nom} ({selectedMembre.email})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date effective *
              </label>
              <input
                type="date"
                value={dateEffective}
                onChange={(e) => setDateEffective(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
              {actionType === 'RETRAITE' ? (
                <span>
                  Cette action clôturera immédiatement tous les mandats et rôles actifs du membre, archivera sa période d'affiliation et passera son compte à l'état <strong>GELE</strong> (lecture seule, non réactivable).
                </span>
              ) : (
                <span>
                  Cette action clôturera les rôles et mandats, révoquera tous les jetons JWT actifs et passera le compte à l'état <strong>DESACTIVE</strong>.
                </span>
              )}
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedMembre(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition ${
                  actionType === 'RETRAITE'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {saving ? 'Traitement...' : 'Confirmer l\'opération'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
