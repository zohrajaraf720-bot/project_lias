import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  Video,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { EvenementDTO, ParticipationDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { useToast } from '../../lib/toastContext';

export const EvenementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [evenement, setEvenement] = useState<EvenementDTO | null>(null);
  const [participations, setParticipations] = useState<ParticipationDTO[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      const [evRes, partRes] = await Promise.all([
        api.get<EvenementDTO>(`/evenements/${id}`),
        api.get<ParticipationDTO[]>(`/evenements/${id}/participations`),
      ]);

      setEvenement(evRes.data);
      setParticipations(partRes.data || []);
      const userInscrit = (partRes.data || []).some((p: any) => (p.membre?.id ?? p.id) === user?.id);
      setIsRegistered(userInscrit);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id, user]);

  const handleRegister = async () => {
    if (
      evenement?.statut === 'TERMINE' ||
      evenement?.statut === 'ARCHIVE' ||
      evenement?.statut === 'ANNULE'
    ) {
      error('Cet événement est terminé. Les inscriptions sont closes.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/evenements/${id}/inscrire`);
      success('Votre inscription à cet événement a été validée !');
      setIsRegistered(true);
      fetchDetail();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!window.confirm('Confirmez-vous l\'annulation de votre participation ?')) return;

    setActionLoading(true);
    try {
      await api.delete(`/evenements/${id}/desinscrire`);
      success('Votre désinscription a été effectuée.');
      setIsRegistered(false);
      fetchDetail();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de la désinscription.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement de l'événement..." />;
  }

  if (!evenement) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Événement introuvable</h2>
        <Link to="/evenements" className="text-blue-600 text-sm mt-4 inline-block font-semibold">
          ← Retour aux événements
        </Link>
      </div>
    );
  }

  const isTermine =
    evenement.statut === 'TERMINE' ||
    evenement.statut === 'ARCHIVE' ||
    evenement.statut === 'ANNULE' ||
    (evenement.dateFin
      ? new Date(evenement.dateFin).getTime() < Date.now()
      : new Date(evenement.dateDebut).getTime() < Date.now());

  const isValide = !evenement.statutValidation || evenement.statutValidation === 'VALIDE';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link to="/evenements" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux événements</span>
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider font-mono">
            {(evenement.typeEvenement || evenement.type || 'EVENEMENT').replace('_', ' ')}
          </span>
          <div className="flex items-center gap-2">
            <StatusBadge status={evenement.statut} />
            <StatusBadge status={evenement.statutValidation} />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          {evenement.titre}
        </h1>

        {evenement.statutValidation === 'REJETE' && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-red-800 text-sm">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>Cet événement a été refusé par la Direction du Laboratoire</span>
            </div>
            {evenement.commentaireValidation && (
              <p className="pl-7 text-xs text-red-700 leading-relaxed italic">
                Motif communiqué : « {evenement.commentaireValidation} »
              </p>
            )}
            {evenement.dateValidation && (
              <p className="pl-7 text-[11px] text-slate-500">
                Décision enregistrée le {new Date(evenement.dateValidation).toLocaleDateString('fr-FR')} {evenement.valideurNom ? `par ${evenement.valideurNom}` : ''}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <span className="text-slate-400 font-medium block">Date & Heure</span>
              <span className="font-bold text-slate-800">
                {new Date(evenement.dateDebut).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <span className="text-slate-400 font-medium block">Lieu</span>
              <span className="font-bold text-slate-800">{evenement.lieu || 'Non précisé'}</span>
            </div>
          </div>
        </div>

        {evenement.lienWebinaire && (
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-blue-900 font-semibold">
              <Video className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>Cet événement est également diffusé en visioconférence.</span>
            </div>
            <a
              href={evenement.lienWebinaire}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 flex-shrink-0 shadow-xs"
            >
              <span>Rejoindre</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {evenement.description}
          </p>
        </div>

        {evenement.programmeDetaille && (
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Programme Détaillé</h2>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
              {evenement.programmeDetaille}
            </div>
          </div>
        )}

        {/* Action Registration Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Organisé par{' '}
            <strong className="text-slate-800">
              {evenement.organisateurs && evenement.organisateurs.length > 0
                ? evenement.organisateurs.map((o) => `${o.prenom} ${o.nom}`).join(', ')
                : evenement.organisateur
                ? `${evenement.organisateur.prenom} ${evenement.organisateur.nom}`
                : 'Laboratoire LIAS'}
            </strong>
          </div>

          <div>
            {isTermine ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  {isRegistered
                    ? 'Événement terminé (vous y avez participé)'
                    : 'Événement terminé — Inscriptions closes'}
                </span>
              </div>
            ) : !isValide ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-semibold text-xs border border-amber-200">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Inscriptions non ouvertes (en attente de validation)</span>
              </div>
            ) : isRegistered ? (
              <button
                onClick={handleUnregister}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Annuler mon inscription</span>
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>S'inscrire à l'événement</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Participants Roster */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              Participants Inscrits ({participations.length})
            </h2>
          </div>
        </div>

        {participations.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Aucun inscrit pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {participations.map((part: any) => {
              const mId = part.membre?.id ?? part.id;
              const mNom = part.membre?.nom ?? part.nom;
              const mPrenom = part.membre?.prenom ?? part.prenom;
              const mStatut = part.membre?.statut ?? part.statut ?? part.roleSysteme;
              return (
                <div key={mId} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2.5">
                  <Avatar
                    src={part.membre?.photo || part.photo}
                    alt={`${mPrenom} ${mNom}`}
                    size="sm"
                    rounded="rounded-lg"
                  />
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {mPrenom} {mNom}
                    </div>
                    <div className="text-[10px] text-slate-400">{mStatut}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
