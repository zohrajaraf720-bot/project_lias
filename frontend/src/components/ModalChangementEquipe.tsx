import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Send,
  AlertCircle,
  Layers,
  UserCheck,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/authContext';
import { EquipeDTO, DemandeChangementEquipeDTO } from '../types';
import { Modal } from './Modal';
import { useToast } from '../lib/toastContext';

interface ModalChangementEquipeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ModalChangementEquipe: React.FC<ModalChangementEquipeProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [mesDemandes, setMesDemandes] = useState<DemandeChangementEquipeDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  // actionType: 'REJOINDRE' (if no team) | 'CHANGER' (if in team) | 'QUITTER' (if in team)
  const [actionType, setActionType] = useState<'REJOINDRE' | 'CHANGER' | 'QUITTER'>('CHANGER');
  const [cibleEquipeId, setCibleEquipeId] = useState<string>('');
  const [motif, setMotif] = useState('');

  const currentEquipeId = user?.equipeId;
  const currentEquipeNom = user?.equipeNom;

  const loadData = async () => {
    try {
      setLoading(true);
      const [eqRes, demRes] = await Promise.all([
        api.get<EquipeDTO[]>('/equipes'),
        api.get<DemandeChangementEquipeDTO[]>('/equipes/mes-demandes-changement').catch(() => ({ data: [] })),
      ]);
      setEquipes(eqRes.data || []);
      setMesDemandes(demRes.data || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (!currentEquipeId) {
        setActionType('REJOINDRE');
      } else {
        setActionType('CHANGER');
      }
      setCibleEquipeId('');
      setMotif('');
    }
  }, [isOpen, currentEquipeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motif.trim()) {
      error('Veuillez fournir un motif pour votre demande.');
      return;
    }

    let nouvelleEquipeId: number | undefined = undefined;
    if (actionType === 'REJOINDRE' || actionType === 'CHANGER') {
      if (!cibleEquipeId) {
        error('Veuillez sélectionner une équipe cible.');
        return;
      }
      nouvelleEquipeId = Number(cibleEquipeId);
    }

    setSubmitting(true);
    try {
      await api.post('/equipes/demandes-changement', {
        nouvelleEquipeId,
        motif: motif.trim(),
      });

      success('Votre demande de changement d\'équipe a été soumise à la Direction avec succès.');
      setMotif('');
      setCibleEquipeId('');
      loadData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la soumission de la demande.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasPending = mesDemandes.some((d) => d.statut === 'EN_ATTENTE');
  const availableTargetEquipes = equipes.filter((eq) => !currentEquipeId || eq.id !== currentEquipeId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mobilité & Changement d'Équipe de Recherche"
      maxWidth="2xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Situation actuelle */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Situation actuelle
            </span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {currentEquipeId ? (
                  <>Rattaché à l'équipe <strong className="text-blue-700">{currentEquipeNom}</strong></>
                ) : (
                  <span className="text-amber-700">Non rattaché à une équipe de recherche</span>
                )}
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-slate-600 border border-slate-200 self-start sm:self-auto">
            {user?.statut || 'Chercheur'}
          </span>
        </div>

        {/* Pending request banner if any */}
        {hasPending && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-spin" />
            <div className="leading-relaxed">
              <strong className="block font-bold">Demande en cours d'examen :</strong>
              Vous avez déjà une demande de mobilité soumise à la Direction. Vous pourrez en soumettre une nouvelle dès que la Direction aura statué.
            </div>
          </div>
        )}

        {/* Formulaire de demande (si aucune demande en attente) */}
        {!hasPending ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Type d'opération souhaitée <span className="text-rose-500">*</span>
              </label>

              {currentEquipeId ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActionType('CHANGER')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2.5 ${
                      actionType === 'CHANGER'
                        ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowLeftRight className={`w-4 h-4 ${actionType === 'CHANGER' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <div>Changer d'équipe</div>
                      <div className="text-[10px] font-normal text-slate-400">Rejoindre une autre équipe du labo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('QUITTER')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2.5 ${
                      actionType === 'QUITTER'
                        ? 'border-amber-600 bg-amber-50/60 text-amber-900 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className={`w-4 h-4 ${actionType === 'QUITTER' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <div>
                      <div>Quitter mon équipe</div>
                      <div className="text-[10px] font-normal text-slate-400">Devenir chercheur non rattaché</div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 text-blue-900 text-xs font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Demande de premier rattachement à une équipe de recherche</span>
                </div>
              )}
            </div>

            {/* Choix de l'équipe cible (si REJOINDRE ou CHANGER) */}
            {(actionType === 'REJOINDRE' || actionType === 'CHANGER') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Équipe de recherche souhaitée <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cibleEquipeId}
                  onChange={(e) => setCibleEquipeId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">-- Choisissez l'équipe de destination --</option>
                  {availableTargetEquipes.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.nom} {eq.acronyme ? `(${eq.acronyme})` : ''} — {eq.nombreMembres} membre(s)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Justification / Motif */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motif & Justification scientifique <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                required
                placeholder="Expliquez la motivation de votre demande (thématiques de recherche, collaborations de projet, réorientation scientifique)..."
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || ((actionType === 'REJOINDRE' || actionType === 'CHANGER') && !cibleEquipeId)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Envoi...' : 'Soumettre la demande à la Direction'}</span>
              </button>
            </div>
          </form>
        ) : null}

        {/* Historique des demandes passées */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Historique de vos demandes de mobilité ({mesDemandes.length})</span>
            </h4>
          </div>

          {mesDemandes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Vous n'avez soumis aucune demande de changement d'équipe pour le moment.
            </div>
          ) : (
            <div className="space-y-2.5">
              {mesDemandes.map((dem) => {
                const isPending = dem.statut === 'EN_ATTENTE';
                const isAccepted = dem.statut === 'ACCEPTEE';
                const isRefused = dem.statut === 'REFUSEE';

                return (
                  <div
                    key={dem.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>En cours d'examen</span>
                          </span>
                        )}
                        {isAccepted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Acceptée</span>
                          </span>
                        )}
                        {isRefused && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Refusée</span>
                          </span>
                        )}

                        {/* Visual change path */}
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          {dem.typeChangement === 'RATTACHEMENT' && (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[11px]">
                              Sans équipe ➔ {dem.nouvelleEquipeNom}
                            </span>
                          )}
                          {dem.typeChangement === 'TRANSFERT' && (
                            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold text-[11px]">
                              {dem.ancienneEquipeNom} ➔ {dem.nouvelleEquipeNom}
                            </span>
                          )}
                          {dem.typeChangement === 'DETACHEMENT' && (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold text-[11px]">
                              {dem.ancienneEquipeNom} ➔ Sans équipe
                            </span>
                          )}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400">
                        {new Date(dem.dateDemande).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Motif */}
                    <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      "{dem.motif}"
                    </p>

                    {/* Decision info */}
                    {isAccepted && (
                      <div className="text-[11px] text-emerald-700 font-medium">
                        Validée le {new Date(dem.dateDecision || '').toLocaleDateString('fr-FR')} {dem.decideurNom ? `par ${dem.decideurNom}` : ''}
                      </div>
                    )}
                    {isRefused && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] text-rose-900 space-y-0.5">
                        <div className="font-bold">
                          Refusée le {new Date(dem.dateDecision || '').toLocaleDateString('fr-FR')} {dem.decideurNom ? `par ${dem.decideurNom}` : ''}
                        </div>
                        {dem.motifRefus && (
                          <div className="text-rose-800">
                            <strong>Motif :</strong> {dem.motifRefus}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
