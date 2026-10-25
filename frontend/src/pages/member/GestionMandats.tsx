import React, { useEffect, useState } from 'react';
import {
  Award,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  History,
  XCircle,
} from 'lucide-react';
import api from '../../lib/api';
import { TypeMandat, MembreResumeDTO, EquipeDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toastContext';
import { useAuth } from '../../lib/authContext';

interface MandatDTO {
  id: number;
  typeMandat: TypeMandat;
  dateDebut: string;
  dateFin?: string;
  membre: MembreResumeDTO;
  equipe?: { id: number; nom: string; acronyme: string };
}

export const GestionMandats: React.FC = () => {
  const { success, error } = useToast();
  const { canManageMandats } = useAuth();

  const [mandatsHistorique, setMandatsHistorique] = useState<MandatDTO[]>([]);
  const [chercheurs, setChercheurs] = useState<MembreResumeDTO[]>([]);
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeMandat, setTypeMandat] = useState<TypeMandat>('CHEF_EQUIPE');
  const [membreId, setMembreId] = useState('');
  const [equipeId, setEquipeId] = useState('');
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [manRes, chRes, eqRes] = await Promise.all([
        api.get<MandatDTO[]>('/mandats/historique'),
        api.get<{ contenu: MembreResumeDTO[] }>('/membres?statut=PERMANENT&taille=100'),
        api.get<EquipeDTO[]>('/equipes'),
      ]);
      setMandatsHistorique(manRes.data || []);
      setChercheurs(chRes.data?.contenu || []);
      setEquipes(eqRes.data || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMandat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membreId || !dateDebut) return;
    if (typeMandat === 'CHEF_EQUIPE' && !equipeId) {
      error('Veuillez sélectionner une équipe pour le mandat de Chef d\'équipe.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/mandats', {
        typeMandat,
        membreId: Number(membreId),
        equipeId: equipeId ? Number(equipeId) : undefined,
        dateDebut,
      });

      success('Mandat attribué avec succès ! L\'ancien mandat équivalent a été automatiquement clôturé.');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de l\'attribution du mandat.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloturer = async (id: number) => {
    if (!window.confirm('Confirmez-vous la clôture de ce mandat ?')) return;

    try {
      await api.put(`/mandats/${id}/cloturer`, {
        dateFin: new Date().toISOString().split('T')[0],
      });
      success('Mandat clôturé.');
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la clôture.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement de l'historique des mandats..." />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Direction & Mandats</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gestion des Mandats de Gouvernance
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Attribution des mandats de Direction (Directeur, Vice-Directeur) et de Responsables d'Équipes.
          </p>
        </div>

        {canManageMandats ? (
          <button
            onClick={() => {
              setMembreId('');
              setEquipeId('');
              setDateDebut(new Date().toISOString().split('T')[0]);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Attribuer un Mandat</span>
          </button>
        ) : (
          <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>Consultation Seule</span>
          </div>
        )}
      </div>

      {!canManageMandats && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>En tant que Vice-Directeur, vous disposez d'un droit de consultation sur l'historique et la chronologie des mandats de direction et chefs d'équipes.</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <History className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-sm">Chronologie des Mandats de Direction</h2>
        </div>

        {mandatsHistorique.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Aucun mandat enregistré.</p>
        ) : (
          <div className="space-y-4">
            {mandatsHistorique.map((m) => {
              const isActif = !m.dateFin;
              return (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl border border-slate-200/70 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md font-mono">
                        {m.typeMandat.replace('_', ' ')}
                      </span>
                      {isActif ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Actif
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                          Clôturé
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">
                      {m.membre?.prenom} {m.membre?.nom} ({m.membre?.email})
                    </h4>

                    <div className="text-xs text-slate-500">
                      Période : {m.dateDebut} → {m.dateFin || 'Présent'}
                      {m.equipe && ` • Équipe ${m.equipe.acronyme} (${m.equipe.nom})`}
                    </div>
                  </div>

                  {isActif && canManageMandats && (
                    <button
                      onClick={() => handleCloturer(m.id)}
                      className="px-3.5 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition self-start sm:self-auto"
                    >
                      Clôturer le mandat
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Attribuer un Nouveau Mandat"
        maxWidth="md"
      >
        <form onSubmit={handleCreateMandat} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Type de mandat *</label>
            <select
              value={typeMandat}
              onChange={(e) => setTypeMandat(e.target.value as TypeMandat)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="CHEF_EQUIPE">Chef d'Équipe</option>
              <option value="DIRECTEUR">Directeur du Laboratoire</option>
              <option value="VICE_DIRECTEUR">Vice-Directeur du Laboratoire</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Enseignant-Chercheur mandaté (Permanent) *
            </label>
            <select
              value={membreId}
              onChange={(e) => setMembreId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              required
            >
              <option value="">Sélectionner un membre permanent...</option>
              {chercheurs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.prenom} {c.nom} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {typeMandat === 'CHEF_EQUIPE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Équipe de recherche concernée *
              </label>
              <select
                value={equipeId}
                onChange={(e) => setEquipeId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                required
              >
                <option value="">Sélectionner l'équipe...</option>
                {equipes.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.acronyme} - {eq.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date de prise de fonction *</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              required
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
            >
              Confirmer le mandat
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
