import React, { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCheck,
  UserPlus,
  UserMinus,
  Sparkles,
} from 'lucide-react';
import api from '../lib/api';
import { MembreInterneDTO, EquipeDTO } from '../types';
import { Modal } from './Modal';
import { StatusBadge } from './Badge';
import { useToast } from '../lib/toastContext';

interface ModalAffectationDirecteEquipeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMembreId?: number;
}

export const ModalAffectationDirecteEquipe: React.FC<ModalAffectationDirecteEquipeProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMembreId,
}) => {
  const { success, error } = useToast();

  const [membres, setMembres] = useState<MembreInterneDTO[]>([]);
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [searchMember, setSearchMember] = useState('');
  const [selectedMembreId, setSelectedMembreId] = useState<string>('');
  const [targetEquipeId, setTargetEquipeId] = useState<string>('NONE'); // 'NONE' for detachment or equipeId
  const [motif, setMotif] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        const [mRes, eqRes] = await Promise.all([
          api.get<{ contenu: MembreInterneDTO[] }>('/membres?taille=200'),
          api.get<EquipeDTO[]>('/equipes'),
        ]);
        const allMembres = mRes.data?.contenu || [];
        setMembres(allMembres);
        setEquipes(eqRes.data || []);

        if (initialMembreId) {
          setSelectedMembreId(initialMembreId.toString());
        }
      } catch {
        // Ignorer
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [isOpen, initialMembreId]);

  const selectedMember = membres.find((m) => m.id.toString() === selectedMembreId);

  // When selected member changes, set default target
  useEffect(() => {
    if (selectedMember) {
      if (!selectedMember.equipeId) {
        // Member has no team -> default to first team if exists
        if (equipes.length > 0) {
          setTargetEquipeId(equipes[0].id.toString());
        } else {
          setTargetEquipeId('NONE');
        }
      } else {
        // Member has team -> default to 'NONE' (detachment) or another team
        const otherTeam = equipes.find((e) => e.id !== selectedMember.equipeId);
        setTargetEquipeId(otherTeam ? otherTeam.id.toString() : 'NONE');
      }
    }
  }, [selectedMembreId, equipes]);

  const filteredMembers = membres.filter((m) => {
    if (!searchMember.trim()) return true;
    const q = searchMember.toLowerCase();
    const fullName = `${m.prenom} ${m.nom}`.toLowerCase();
    const email = m.email.toLowerCase();
    const eqName = (m.equipeNom || '').toLowerCase();
    return fullName.includes(q) || email.includes(q) || eqName.includes(q);
  });

  const isDetachment = targetEquipeId === 'NONE';
  const targetEquipe = equipes.find((e) => e.id.toString() === targetEquipeId);

  // Check validity
  const currentEquipeId = selectedMember?.equipeId;
  const isSameEquipe = !isDetachment && currentEquipeId && targetEquipeId === currentEquipeId.toString();
  const isAlreadyNoTeam = isDetachment && !currentEquipeId;
  const isInvalidSelection = isSameEquipe || isAlreadyNoTeam;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      error('Veuillez sélectionner un membre du laboratoire.');
      return;
    }
    if (isInvalidSelection) {
      error("La destination choisie est identique à l'affectation actuelle du membre.");
      return;
    }

    setSubmitting(true);
    try {
      await api.put('/equipes/affectation-directe', {
        membreId: selectedMember.id,
        nouvelleEquipeId: isDetachment ? null : Number(targetEquipeId),
        motif: motif.trim() || undefined,
      });

      success(`L'affectation de ${selectedMember.prenom} ${selectedMember.nom} a été effectuée avec succès !`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de l'affectation du membre.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Affectation Directe d'un Membre (Direction)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 text-xs text-purple-900 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            En tant que <strong>Directeur</strong>, cette affectation prend effet immédiatement sans passer par une demande préalable. L'historique et la traçabilité sont automatiquement enregistrés et le membre en sera notifié.
          </p>
        </div>

        {/* Step 1: Member Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            1. Sélectionner le membre du laboratoire <span className="text-red-500">*</span>
          </label>

          {/* Quick search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrer par nom, prénom, email ou équipe..."
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <select
            value={selectedMembreId}
            onChange={(e) => setSelectedMembreId(e.target.value)}
            required
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="">-- Choisir un membre ({filteredMembers.length} membres) --</option>
            {filteredMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.prenom} {m.nom} ({m.email}) • {m.statut} • {m.equipeNom ? `Équipe ${m.equipeNom}` : 'Sans équipe'}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Member Details Card */}
        {selectedMember && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Membre sélectionné
              </span>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-sm">
                  {selectedMember.prenom} {selectedMember.nom}
                </span>
                <StatusBadge status={selectedMember.statut} />
              </div>
              <p className="text-slate-500">{selectedMember.email}</p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Situation Actuelle
              </span>
              {selectedMember.equipeNom ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-bold">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedMember.equipeNom}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Aucune équipe (Non rattaché)</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Target Team Selection */}
        {selectedMember && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              2. Nouvelle affectation décidée par la Direction <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
              {/* Option: Detachment / Sans équipe */}
              <label
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                  targetEquipeId === 'NONE'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="targetEquipe"
                  value="NONE"
                  checked={targetEquipeId === 'NONE'}
                  onChange={() => setTargetEquipeId('NONE')}
                  className="mt-0.5 text-purple-600 focus:ring-purple-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <UserMinus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sans équipe (Détachement)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Le membre ne sera rattaché à aucune équipe du laboratoire.
                  </p>
                </div>
              </label>

              {/* Options for each active team */}
              {equipes.map((eq) => {
                const isCurrent = selectedMember.equipeId === eq.id;
                const isSelected = targetEquipeId === eq.id.toString();

                return (
                  <label
                    key={eq.id}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold shadow-2xs'
                        : isCurrent
                        ? 'border-slate-200 bg-slate-100/70 text-slate-400'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetEquipe"
                      value={eq.id.toString()}
                      checked={isSelected}
                      onChange={() => setTargetEquipeId(eq.id.toString())}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {eq.acronyme}
                        </span>
                        <span className="truncate">{eq.nom}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-slate-400 font-medium">(Actuelle)</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal truncate">
                        Chef : {eq.chefEquipe ? `${eq.chefEquipe.prenom} ${eq.chefEquipe.nom}` : 'Non désigné'} • {eq.nombreMembres} membres
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Validation warning if same target */}
            {isSameEquipe && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Le membre est déjà rattaché à cette équipe. Veuillez choisir une équipe différente ou un détachement.</span>
              </p>
            )}
            {isAlreadyNoTeam && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Le membre n'a actuellement aucune équipe. Veuillez choisir une équipe de rattachement.</span>
              </p>
            )}
          </div>
        )}

        {/* Live Visual Mobility Pathway */}
        {selectedMember && !isInvalidSelection && (
          <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200/70 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900">
                Trajet de Mobilité :
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium">
                {selectedMember.equipeNom || 'Sans équipe'}
              </span>
              <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="px-2 py-0.5 rounded-lg bg-purple-600 text-white font-bold">
                {isDetachment ? 'Sans équipe (Détachement)' : targetEquipe?.nom}
              </span>
            </div>

            <div>
              {!selectedMember.equipeId && !isDetachment && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Rattachement Direct
                </span>
              )}
              {selectedMember.equipeId && !isDetachment && (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                  Transfert Direct
                </span>
              )}
              {selectedMember.equipeId && isDetachment && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  Détachement Direct
                </span>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Optional Administrative Motif */}
        {selectedMember && (
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              3. Justification administrative / Motif <span className="text-slate-400 font-normal">(Optionnel)</span>
            </label>
            <textarea
              rows={2}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex : Réaffectation stratégique pour le projet H2020, demande orale du conseil de laboratoire..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none leading-relaxed"
            />
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedMember || isInvalidSelection}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Application...' : "Appliquer l'Affectation Immédiatement"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
