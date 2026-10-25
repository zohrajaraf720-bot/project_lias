import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import api from '../../lib/api';
import { EvenementDTO, PageDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toastContext';

export const EvenementsAValider: React.FC = () => {
  const [evenements, setEvenements] = useState<EvenementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState<string>('TOUS');
  const [actionId, setActionId] = useState<number | null>(null);

  // Rejection Modal State
  const [eventToReject, setEventToReject] = useState<EvenementDTO | null>(null);
  const [motifRejet, setMotifRejet] = useState<string>('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const { success, error } = useToast();

  const fetchEvenements = async () => {
    setLoading(true);
    try {
      // Tenter de récupérer l'ensemble des événements pour la gouvernance
      let data: EvenementDTO[] = [];
      try {
        const res = await api.get<EvenementDTO[]>('/evenements/gouvernance');
        data = res.data || [];
      } catch {
        const resFallback = await api.get<PageDTO<EvenementDTO>>('/evenements?taille=100');
        data = resFallback.data?.contenu || [];
      }
      setEvenements(data);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvenements();
  }, []);

  const handleValider = async (id: number) => {
    setActionId(id);
    try {
      await api.put(`/evenements/${id}/valider`);
      success("L'événement a été validé et publié au calendrier officiel.");
      fetchEvenements();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de la validation de l'événement.");
    } finally {
      setActionId(null);
    }
  };

  const openRejectModal = (ev: EvenementDTO) => {
    setEventToReject(ev);
    setMotifRejet('');
  };

  const handleConfirmerRejet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventToReject) return;

    if (!motifRejet.trim()) {
      error('Veuillez renseigner un motif pour justifier le refus de cet événement.');
      return;
    }

    setRejectLoading(true);
    try {
      await api.put(`/evenements/${eventToReject.id}/rejeter`, {
        commentaire: motifRejet.trim(),
        motif: motifRejet.trim(),
      });
      success(`L'événement « ${eventToReject.titre} » a été refusé avec succès.`);
      setEventToReject(null);
      fetchEvenements();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors du rejet de l'événement.");
    } finally {
      setRejectLoading(false);
    }
  };

  const getStatutValidation = (ev: EvenementDTO): string => {
    return ev.statutValidation || 'EN_ATTENTE_VALIDATION';
  };

  const countEnAttente = evenements.filter(
    (e) => getStatutValidation(e) === 'EN_ATTENTE_VALIDATION'
  ).length;
  const countValides = evenements.filter(
    (e) => getStatutValidation(e) === 'VALIDE'
  ).length;
  const countRejetes = evenements.filter(
    (e) => getStatutValidation(e) === 'REJETE'
  ).length;

  // Trié du plus récent au plus ancien
  const evenementsFiltres = [...evenements]
    .filter((e) => {
      if (filtreStatut === 'TOUS') return true;
      return getStatutValidation(e) === filtreStatut;
    })
    .sort((a, b) => {
      const dateA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : a.dateDebut
        ? new Date(a.dateDebut).getTime()
        : 0;
      const dateB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : b.dateDebut
        ? new Date(b.dateDebut).getTime()
        : 0;
      return dateB - dateA;
    });

  if (loading) {
    return <LoadingSpinner text="Chargement des événements de gouvernance..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Gouvernance & Validation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Validation & Historique des Événements
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Examinez les séminaires, workshops et soutenances proposés par les chercheurs et suivez l'historique des décisions.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setFiltreStatut('TOUS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filtreStatut === 'TOUS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({evenements.length})
          </button>
          <button
            onClick={() => setFiltreStatut('EN_ATTENTE_VALIDATION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filtreStatut === 'EN_ATTENTE_VALIDATION'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <span>En attente</span>
            {countEnAttente > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-600 text-[10px] text-white flex items-center justify-center font-bold">
                {countEnAttente}
              </span>
            )}
          </button>
          <button
            onClick={() => setFiltreStatut('VALIDE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filtreStatut === 'VALIDE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <span>Validés</span>
            {countValides > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-700 text-[10px] text-white flex items-center justify-center font-bold">
                {countValides}
              </span>
            )}
          </button>
          <button
            onClick={() => setFiltreStatut('REJETE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filtreStatut === 'REJETE'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-red-700'
            }`}
          >
            <span>Rejetés</span>
            {countRejetes > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-700 text-[10px] text-white flex items-center justify-center font-bold">
                {countRejetes}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Events List */}
      {evenementsFiltres.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Aucun événement dans cette catégorie</h2>
          <p className="text-xs text-slate-400 mt-1">
            {filtreStatut === 'EN_ATTENTE_VALIDATION'
              ? 'Toutes les propositions d’événements ont été traitées.'
              : 'Aucun enregistrement ne correspond aux filtres appliqués.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {evenementsFiltres.map((ev) => {
            const stVal = getStatutValidation(ev);

            return (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition"
              >
                <div className="space-y-2.5 flex-1">
                  {/* Status & Type Bar */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {(ev.typeEvenement || ev.type || 'EVENEMENT').replace('_', ' ')}
                    </span>

                    {stVal === 'VALIDE' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Validé & Publié</span>
                      </span>
                    )}

                    {stVal === 'REJETE' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Rejeté</span>
                      </span>
                    )}

                    {stVal === 'EN_ATTENTE_VALIDATION' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>En attente de validation</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400">
                      Proposé par {ev.organisateur?.prenom} {ev.organisateur?.nom}{' '}
                      {ev.organisateur?.email && `(${ev.organisateur.email})`}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-snug">
                      {ev.titre}
                    </h3>
                    {ev.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* Date & Location */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        {new Date(ev.dateDebut).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {ev.lieu && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span>{ev.lieu}</span>
                      </div>
                    )}
                  </div>

                  {/* Historical Decision Details */}
                  {stVal === 'VALIDE' && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Événement validé et publié au calendrier officiel
                        {ev.dateValidation && (
                          <span className="font-normal text-slate-500">
                            {' '}• le {new Date(ev.dateValidation).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {ev.valideurNom && (
                          <span className="font-normal text-slate-500">
                            {' '}par {ev.valideurNom}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {stVal === 'REJETE' && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>Événement rejeté par la Direction</span>
                        {ev.dateValidation && (
                          <span className="font-normal text-slate-500">
                            • le {new Date(ev.dateValidation).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {ev.valideurNom && (
                          <span className="font-normal text-slate-500">
                            par {ev.valideurNom}
                          </span>
                        )}
                      </div>
                      {ev.commentaireValidation && (
                        <div className="pl-5 text-slate-700 italic">
                          Motif notifié : « {ev.commentaireValidation} »
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                  <Link
                    to={`/evenements/${ev.id}`}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Consulter</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </Link>

                  {/* Actions strictly when EN_ATTENTE_VALIDATION */}
                  {stVal === 'EN_ATTENTE_VALIDATION' && (
                    <>
                      <button
                        onClick={() => openRejectModal(ev)}
                        disabled={actionId === ev.id}
                        className="px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rejeter</span>
                      </button>
                      <button
                        onClick={() => handleValider(ev.id)}
                        disabled={actionId === ev.id}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valider & Publier</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Rejet avec motif */}
      <Modal
        isOpen={!!eventToReject}
        onClose={() => setEventToReject(null)}
        title="Rejeter la Proposition d'Événement"
        maxWidth="md"
      >
        {eventToReject && (
          <form onSubmit={handleConfirmerRejet} className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200/80 text-xs space-y-1.5">
              <span className="text-red-800 font-bold uppercase tracking-wider text-[10px] block">
                Événement concerné
              </span>
              <p className="font-black text-slate-900 text-sm">
                {eventToReject.titre}
              </p>
              <p className="text-slate-600">
                Proposé par {eventToReject.organisateur?.prenom} {eventToReject.organisateur?.nom}{' '}
                {eventToReject.organisateur?.email && `(${eventToReject.organisateur.email})`}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-slate-500 pt-1 text-[11px]">
                <span>
                  Type :{' '}
                  <strong>
                    {(eventToReject.typeEvenement || eventToReject.type || 'EVENEMENT').replace('_', ' ')}
                  </strong>
                </span>
                {eventToReject.lieu && (
                  <span>
                    Lieu : <strong>{eventToReject.lieu}</strong>
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motif du refus <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={motifRejet}
                onChange={(e) => setMotifRejet(e.target.value)}
                placeholder="Précisez la raison du refus (ex: conflit de dates, descriptif incomplet, thématique non prioritaire)..."
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none font-medium"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                L'organisateur recevra une notification lui expliquant les motifs de la décision de la direction.
              </span>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEventToReject(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={rejectLoading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{rejectLoading ? 'Traitement en cours...' : 'Confirmer le rejet'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
