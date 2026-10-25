import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Boxes,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { MaterielDTO, StatutMateriel } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toastContext';

export const MaterielInventaire: React.FC = () => {
  const { isDirecteur, isViceDirecteur, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [materiels, setMateriels] = useState<MaterielDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [designation, setDesignation] = useState('');
  const [quantiteInitiale, setQuantiteInitiale] = useState(1);
  const [dateArrivage, setDateArrivage] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const fetchMateriels = async () => {
    setLoading(true);
    try {
      const res = await api.get<MaterielDTO[]>('/materiel/stock');
      setMateriels(res.data || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMateriels();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designation.trim()) return;

    setSaving(true);
    try {
      await api.post('/materiel', {
        designation: designation.trim(),
        dateArrivage,
        quantiteInitiale: Number(quantiteInitiale),
      });

      success('Arrivage de matériel enregistré avec succès dans l\'inventaire !');
      setIsModalOpen(false);
      fetchMateriels();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de l'enregistrement de l'arrivage de matériel.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = materiels.filter(
    (m) =>
      (m.designation || m.nom || '').toLowerCase().includes(query.toLowerCase()) ||
      (m.referenceInventaire || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Inventaire du Parc Matériel & Équipements
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Gestion du parc scientifique du LIAS : serveurs de calcul, stations de travail, capteurs IoT et kits robotiques.
          </p>
        </div>

        {(isDirecteur || isViceDirecteur || isAdmin) && (
          <button
            onClick={() => {
              setDesignation('');
              setQuantiteInitiale(1);
              setDateArrivage(new Date().toISOString().split('T')[0]);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Équipement</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par désignation, référence d'inventaire, salle..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner text="Chargement de l'inventaire..." />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <Boxes className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">Aucun matériel trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    REF-LIAS-{mat.id}
                  </span>
                  <StatusBadge status={mat.statut} />
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {mat.designation || mat.nom}
                </h3>

                <div className="text-xs text-slate-500">
                  Date d'arrivage : <span className="font-medium text-slate-700">{mat.dateArrivage || 'Non renseignée'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">En Stock</span>
                    <span className="font-black text-emerald-600 text-sm">
                      {mat.quantiteDisponible}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Arrivage</span>
                    <span className="font-semibold text-slate-700 truncate block">
                      {mat.quantiteInitiale || mat.quantiteTotale || mat.quantiteDisponible} unités
                    </span>
                  </div>
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
        title="Déclarer un Nouvel Arrivage de Matériel"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Désignation du matériel *</label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Ex : Serveur GPU NVIDIA RTX 4090, Station Dell Precision..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date d'arrivage *</label>
              <input
                type="date"
                value={dateArrivage}
                onChange={(e) => setDateArrivage(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantité reçue *</label>
              <input
                type="number"
                min={1}
                value={quantiteInitiale}
                onChange={(e) => setQuantiteInitiale(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Ajouter à l\'inventaire'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
