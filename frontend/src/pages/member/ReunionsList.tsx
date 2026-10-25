import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { ReunionDTO, MembreResumeDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toastContext';

export const ReunionsList: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [reunions, setReunions] = useState<ReunionDTO[]>([]);
  const [membres, setMembres] = useState<MembreResumeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [ordreDuJour, setOrdreDuJour] = useState('');
  const [dateHeure, setDateHeure] = useState('');
  const [lieu, setLieu] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchReunions = async () => {
    setLoading(true);
    try {
      const res = await api.get<ReunionDTO[]>('/reunions/mes-reunions');
      setReunions(res.data || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReunions();
    api.get<{ contenu: MembreResumeDTO[] }>('/membres?taille=100').then((r) => setMembres(r.data?.contenu || []));
  }, []);

  const handleCreateReunion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || !dateHeure || !lieu.trim()) return;

    setSaving(true);
    const isoDate = dateHeure.length === 16 ? `${dateHeure}:00` : dateHeure;
    try {
      await api.post('/reunions', {
        titre: titre.trim(),
        ordreDuJour: ordreDuJour.trim(),
        dateReunion: isoDate,
        dateHeure: isoDate,
        lieu: lieu.trim(),
        participantsIds: selectedParticipants,
      });

      success('Réunion planifiée avec succès !');
      setIsModalOpen(false);
      fetchReunions();
    } catch (err: any) {
      const details = err.response?.data?.details;
      const detailMsg = Array.isArray(details) && details.length > 0
        ? details.map((d: any) => d.message || `${d.champ}: invalide`).join(', ')
        : null;
      error(detailMsg || err.response?.data?.message || 'Erreur lors de la planification de la réunion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Réunions & Procès-Verbaux (PV)
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Convocations d'équipes, comités de direction et archivage obligatoire des comptes-rendus de séance.
          </p>
        </div>

        <button
          onClick={() => {
            setTitre('');
            setOrdreDuJour('');
            setDateHeure('');
            setLieu('');
            setSelectedParticipants([]);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Planifier une Réunion</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner text="Chargement de vos réunions..." />
      ) : reunions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">Aucune réunion au programme</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reunions.map((reu) => (
            <div
              key={reu.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={reu.statut} />
                  {reu.pvDocumentId ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PV Archivé
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3" /> En attente PV
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                  {reu.titre}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {reu.ordreDuJour}
                </p>

                <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      {new Date(reu.dateHeure || (reu as any).dateReunion).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>{reu.lieu}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {reu.participants?.length || 0} participants
                </span>
                <Link
                  to={`/reunions/${reu.id}`}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Détails & PV</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Planifier une Réunion"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateReunion} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Titre de la réunion *</label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Réunion d'axe de recherche IA & Big Data"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Heure *</label>
              <input
                type="datetime-local"
                value={dateHeure}
                onChange={(e) => setDateHeure(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lieu *</label>
              <input
                type="text"
                value={lieu}
                onChange={(e) => setLieu(e.target.value)}
                placeholder="Ex : Salle de réunion LIAS / Visioconférence"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ordre du jour *</label>
            <textarea
              rows={3}
              value={ordreDuJour}
              onChange={(e) => setOrdreDuJour(e.target.value)}
              placeholder="Points à aborder durant la séance..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Participants convoqués ({selectedParticipants.length} sélectionné{selectedParticipants.length > 1 ? 's' : ''})
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
              {membres.length === 0 ? (
                <p className="text-xs text-slate-400 p-1">Aucun membre disponible</p>
              ) : (
                membres
                  .filter((m) => m.id !== user?.id)
                  .map((m) => {
                    const isSelected = selectedParticipants.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition ${
                          isSelected ? 'bg-blue-100/70 text-blue-900 font-semibold' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedParticipants((prev) =>
                              prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                            );
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>{m.prenom} {m.nom}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{m.email}</span>
                      </label>
                    );
                  })
              )}
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
              {saving ? 'Planification...' : 'Créer la réunion'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
