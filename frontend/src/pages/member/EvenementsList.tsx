import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Video,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { EvenementDTO, TypeEvenement, PageDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toastContext';

export const EvenementsList: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [evenements, setEvenements] = useState<EvenementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tous' | 'mes-inscriptions'>('tous');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [typeEvenement, setTypeEvenement] = useState<TypeEvenement>('SEMINAIRE');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [lieu, setLieu] = useState('');
  const [lienWebinaire, setLienWebinaire] = useState('');
  const [programmeDetaille, setProgrammeDetaille] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchEvenements = async () => {
    setLoading(true);
    try {
      const res = await api.get<PageDTO<EvenementDTO>>('/evenements?taille=50');
      setEvenements(res.data.contenu || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvenements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || !dateDebut || !lieu.trim()) {
      setModalError('Veuillez renseigner les champs obligatoires.');
      return;
    }

    setSaving(true);
    setModalError(null);

    const payload = {
      titre: titre.trim(),
      description: description.trim(),
      typeEvenement,
      dateDebut: dateDebut + ':00',
      dateFin: dateFin ? dateFin + ':00' : dateDebut + ':00',
      lieu: lieu.trim(),
      lienWebinaire: lienWebinaire.trim() || undefined,
      programmeDetaille: programmeDetaille.trim() || undefined,
    };

    try {
      await api.post('/evenements', payload);
      success('Événement proposé avec succès ! Il a été soumis à la direction pour validation.');
      setIsModalOpen(false);
      fetchEvenements();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erreur lors de la création de l'événement.";
      setModalError(msg);
      error(msg);
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
            Événements & Séminaires Scientifiques
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Soutenances de thèses, séminaires de recherche, workshops et journées d'étude du LIAS.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Proposer un Événement</span>
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <LoadingSpinner text="Chargement des événements..." />
      ) : evenements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">Aucun événement programmé pour le moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evenements.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    {(ev.typeEvenement || ev.type || 'EVENEMENT').replace('_', ' ')}
                  </span>
                  {ev.statutValidation === 'REJETE' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>Rejeté</span>
                    </span>
                  ) : ev.statutValidation === 'EN_ATTENTE_VALIDATION' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>En attente</span>
                    </span>
                  ) : (
                    <StatusBadge status={ev.statut} />
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                  {ev.titre}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {ev.description}
                </p>

                {/* Rejection / Pending Notification Block */}
                {ev.statutValidation === 'REJETE' && (
                  <div className="p-3 rounded-xl bg-red-50/80 border border-red-200 text-xs text-red-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>Événement non retenu par la Direction</span>
                    </div>
                    {ev.commentaireValidation && (
                      <p className="pl-5 text-[11px] text-slate-700 italic">
                        Motif : « {ev.commentaireValidation} »
                      </p>
                    )}
                  </div>
                )}

                {ev.statutValidation === 'EN_ATTENTE_VALIDATION' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>En attente de validation par la Direction</span>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span>{new Date(ev.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{ev.lieu || 'Lieu à définir'}</span>
                  </div>
                  {ev.lienWebinaire && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Video className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Visioconférence disponible</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {ev.nombreInscrits ?? 0} inscrit{(ev.nombreInscrits ?? 0) > 1 ? 's' : ''}
                </span>
                <Link
                  to={`/evenements/${ev.id}`}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Consulter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proposal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Proposer un Événement Scientifique"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {modalError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Titre de l'événement *</label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Soutenance de Thèse - M. Karim (Systèmes Distribués)"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type d'événement *</label>
              <select
                value={typeEvenement}
                onChange={(e) => setTypeEvenement(e.target.value as TypeEvenement)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              >
                <option value="SEMINAIRE">Séminaire de recherche</option>
                <option value="CONFERENCE">Conférence internationale</option>
                <option value="WORKSHOP">Workshop / Atelier de travail</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lieu / Salle *</label>
              <input
                type="text"
                value={lieu}
                onChange={(e) => setLieu(e.target.value)}
                placeholder="Ex : Salle des Thèses, FSBM"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Heure Début *</label>
              <input
                type="datetime-local"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Heure Fin</label>
              <input
                type="datetime-local"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Lien Webinaire (Optionnel)</label>
            <input
              type="url"
              value={lienWebinaire}
              onChange={(e) => setLienWebinaire(e.target.value)}
              placeholder="https://meet.google.com/xyz..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Résumé</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objectifs, intervenants, thématique principale..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              {saving ? 'Transmission...' : 'Soumettre à validation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
