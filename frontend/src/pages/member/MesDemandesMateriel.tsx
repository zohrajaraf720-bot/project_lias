import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { DemandeMaterielDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toastContext';

export const MesDemandesMateriel: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [demandes, setDemandes] = useState<DemandeMaterielDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [descriptionBesoin, setDescriptionBesoin] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [saving, setSaving] = useState(false);

  const fetchMesDemandes = async () => {
    setLoading(true);
    try {
      const res = await api.get<DemandeMaterielDTO[]>('/materiel/mes-demandes');
      setDemandes(res.data || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMesDemandes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descriptionBesoin.trim()) return;

    setSaving(true);
    try {
      await api.post('/materiel/demandes', {
        descriptionBesoin: descriptionBesoin.trim(),
        quantite: Number(quantite),
      });

      success('Votre demande de matériel a été soumise à la direction.');
      setIsModalOpen(false);
      setDescriptionBesoin('');
      setQuantite(1);
      fetchMesDemandes();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la soumission de la demande.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mes Demandes d'Emprunt de Matériel
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Suivi de vos demandes d'équipements scientifiques, serveurs et capteurs auprès de la Direction.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Demande</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner text="Chargement de vos demandes..." />
      ) : demandes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h2 className="text-base font-bold text-slate-800">Aucune demande en cours</h2>
          <p className="text-xs text-slate-500 mt-1">
            Vous n'avez pas encore soumis de demande d'emprunt de matériel.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {demandes.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.statut} />
                  <span className="text-xs text-slate-400 font-medium">
                    Soumise le {new Date(d.dateSoumission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {d.descriptionBesoin}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <div>Quantité souhaitée : <strong className="text-slate-800">{d.quantite}</strong></div>
                  {d.materielAttribue && (
                    <div className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-md">
                      Matériel attribué : {d.materielAttribue}
                    </div>
                  )}
                  {d.commentaireDirection && (
                    <div className="text-slate-600 italic">
                      Note Direction : "{d.commentaireDirection}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Faire une Demande de Matériel"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description du besoin de recherche *
            </label>
            <textarea
              rows={4}
              value={descriptionBesoin}
              onChange={(e) => setDescriptionBesoin(e.target.value)}
              placeholder="Ex : Besoin d'une station de travail avec GPU RTX pour entrainer les modèles de vision par ordinateur dans le cadre de la thèse..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantité souhaitée *</label>
            <input
              type="number"
              min={1}
              max={10}
              value={quantite}
              onChange={(e) => setQuantite(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving ? 'Envoi...' : 'Transmettre la demande'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
