import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Download,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  KeyRound,
  Mail,
  Send,
  Building,
  GraduationCap,
  Users,
} from 'lucide-react';
import api, { downloadFile } from '../../lib/api';
import { DemandeAdhesionDTO, EquipeDTO, StatutMembre } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toastContext';

export const GestionDemandesAdhesion: React.FC = () => {
  const { success, error } = useToast();

  const [demandes, setDemandes] = useState<DemandeAdhesionDTO[]>([]);
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState<string>('TOUS');

  // Acceptance Modal State
  const [demandeToAccept, setDemandeToAccept] = useState<DemandeAdhesionDTO | null>(null);
  const [selectedStatut, setSelectedStatut] = useState<StatutMembre>('DOCTORANT');
  const [selectedEquipeId, setSelectedEquipeId] = useState<string>('');
  const [acceptLoading, setAcceptLoading] = useState(false);

  // Refusal Modal State
  const [demandeToRefuse, setDemandeToRefuse] = useState<DemandeAdhesionDTO | null>(null);
  const [motifRefus, setMotifRefus] = useState<string>('');
  const [refuseLoading, setRefuseLoading] = useState(false);

  const getStatut = (d: DemandeAdhesionDTO): string => {
    return d.statut || d.statutDemande || 'EN_ATTENTE';
  };

  const getStatutSouhaite = (d: DemandeAdhesionDTO): StatutMembre => {
    return d.statutSouhaite || d.typeSouhaite || 'DOCTORANT';
  };

  const getMotif = (d: DemandeAdhesionDTO): string | undefined => {
    return d.motifRefus || d.commentaireDirection;
  };

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const [demRes, eqRes] = await Promise.all([
        api.get<any>('/adhesions'),
        api.get<EquipeDTO[]>('/equipes'),
      ]);
      const rawDem = demRes.data;
      setDemandes(Array.isArray(rawDem) ? rawDem : (rawDem?.contenu || []));
      setEquipes(eqRes.data || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const handleDownloadCv = async (d: DemandeAdhesionDTO) => {
    try {
      await downloadFile(`/adhesions/${d.id}/cv`, `CV_${d.nom}_${d.prenom}.pdf`);
      success('Téléchargement du CV démarré.');
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors du téléchargement du CV.');
    }
  };

  const handleDownloadLettre = async (d: DemandeAdhesionDTO) => {
    try {
      await downloadFile(`/adhesions/${d.id}/lettre`, `Lettre_Motivation_${d.nom}_${d.prenom}.pdf`);
      success('Téléchargement de la lettre de motivation démarré.');
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors du téléchargement de la lettre de motivation.');
    }
  };

  const openAcceptModal = (d: DemandeAdhesionDTO) => {
    setDemandeToAccept(d);
    setSelectedStatut(getStatutSouhaite(d));
    setSelectedEquipeId(d.equipeId ? d.equipeId.toString() : '');
  };

  const handleConfirmerAcceptation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandeToAccept) return;

    setAcceptLoading(true);
    try {
      await api.put(`/adhesions/${demandeToAccept.id}/approuver`, {
        statut: selectedStatut,
        equipeId: selectedEquipeId ? Number(selectedEquipeId) : undefined,
      });

      success(
        `Candidature de ${demandeToAccept.prenom} ${demandeToAccept.nom} acceptée avec succès ! Un compte membre a été créé et un email officiel avec ses identifiants lui a été envoyé.`
      );
      setDemandeToAccept(null);
      fetchDemandes();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de l'acceptation de la candidature.");
    } finally {
      setAcceptLoading(false);
    }
  };

  const openRefuseModal = (d: DemandeAdhesionDTO) => {
    setDemandeToRefuse(d);
    setMotifRefus('');
  };

  const handleConfirmerRefus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandeToRefuse) return;

    setRefuseLoading(true);
    try {
      await api.put(`/adhesions/${demandeToRefuse.id}/rejeter`, {
        motif: motifRefus.trim() || undefined,
        commentaireDirection: motifRefus.trim() || undefined,
      });

      success(
        `La candidature de ${demandeToRefuse.prenom} ${demandeToRefuse.nom} a été refusée. Un email officiel de notification lui a été expédié.`
      );
      setDemandeToRefuse(null);
      fetchDemandes();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors du refus de la candidature.');
    } finally {
      setRefuseLoading(false);
    }
  };

  // Trié du plus récent au plus ancien (newest first)
  const demandesFiltrees = [...demandes]
    .filter((d) => {
      if (filtreStatut === 'TOUS') return true;
      return getStatut(d) === filtreStatut;
    })
    .sort((a, b) => {
      const dateA = a.dateSoumission ? new Date(a.dateSoumission).getTime() : 0;
      const dateB = b.dateSoumission ? new Date(b.dateSoumission).getTime() : 0;
      return dateB - dateA;
    });

  const countEnAttente = demandes.filter((d) => getStatut(d) === 'EN_ATTENTE').length;
  const countAcceptees = demandes.filter((d) => getStatut(d) === 'ACCEPTEE').length;
  const countRefusees = demandes.filter((d) => getStatut(d) === 'REFUSEE').length;

  if (loading) {
    return <LoadingSpinner text="Chargement des candidatures d'adhésion..." />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Gouvernance & Recrutement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Demandes d'Adhésion au Laboratoire LIAS
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Examen des dossiers de candidatures pour intégrer le laboratoire en tant que Doctorant, Chercheur Associé ou Permanent.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setFiltreStatut('TOUS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filtreStatut === 'TOUS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toutes ({demandes.length})
          </button>
          <button
            onClick={() => setFiltreStatut('EN_ATTENTE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filtreStatut === 'EN_ATTENTE'
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
            onClick={() => setFiltreStatut('ACCEPTEE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filtreStatut === 'ACCEPTEE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <span>Acceptées</span>
            {countAcceptees > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-700 text-[10px] text-white flex items-center justify-center font-bold">
                {countAcceptees}
              </span>
            )}
          </button>
          <button
            onClick={() => setFiltreStatut('REFUSEE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filtreStatut === 'REFUSEE' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-red-700'
            }`}
          >
            <span>Refusées</span>
            {countRefusees > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-700 text-[10px] text-white flex items-center justify-center font-bold">
                {countRefusees}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Demandes List */}
      {demandesFiltrees.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Aucune candidature dans cette catégorie</h2>
          <p className="text-xs text-slate-400 mt-1">
            {filtreStatut === 'EN_ATTENTE'
              ? 'Toutes les candidatures ont été traitées.'
              : 'Aucun enregistrement ne correspond aux filtres appliqués.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {demandesFiltrees.map((d) => {
            const statut = getStatut(d);
            const statutSouhaite = getStatutSouhaite(d);
            const motif = getMotif(d);
            const hasLettre = Boolean(d.lettreMotivationUrl || d.cheminLettreMotivation);

            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition"
              >
                <div className="space-y-2.5 flex-1">
                  {/* Status & Date Line */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusBadge status={statut} />
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span>Statut souhaité : {statutSouhaite}</span>
                    </span>
                    {d.equipeNom && (
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Équipe souhaitée : {d.equipeNom}</span>
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Déposée le{' '}
                        {d.dateSoumission
                          ? new Date(d.dateSoumission).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : 'Date inconnue'}
                      </span>
                    </span>
                  </div>

                  {/* Candidate Identity */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {d.prenom} {d.nom}
                    </h3>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-5 gap-y-1.5 mt-1">
                      <span>
                        Email : <strong className="text-slate-800">{d.email}</strong>
                      </span>
                      {d.etablissementOrigine && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>Origine : {d.etablissementOrigine}</span>
                        </span>
                      )}
                      {d.laboratoireOrigine && (
                        <span>Labo d'origine : {d.laboratoireOrigine}</span>
                      )}
                    </div>
                  </div>

                  {/* Motivation quote if available */}
                  {d.motivation && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                      « {d.motivation} »
                    </div>
                  )}

                  {/* Refusal motive or Decision details if processed */}
                  {statut === 'REFUSEE' && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>Candidature refusée</span>
                        {d.dateDecision && (
                          <span className="font-normal text-slate-500">
                            • le {new Date(d.dateDecision).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {d.decideurNom && (
                          <span className="font-normal text-slate-500">
                            par {d.decideurNom}
                          </span>
                        )}
                      </div>
                      {motif && (
                        <div className="pl-5 text-slate-700 italic">
                          Motif notifié : « {motif} »
                        </div>
                      )}
                    </div>
                  )}

                  {statut === 'ACCEPTEE' && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Candidature acceptée • Compte membre actif créé</span>
                        {d.dateDecision && (
                          <span className="font-normal text-slate-500">
                            • le {new Date(d.dateDecision).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {d.decideurNom && (
                          <span className="font-normal text-slate-500">
                            par {d.decideurNom}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                  {/* Download CV */}
                  <button
                    onClick={() => handleDownloadCv(d)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 transition flex items-center gap-1.5 shadow-xs"
                    title="Télécharger le CV au format PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Consulter CV (PDF)</span>
                  </button>

                  {/* Download Lettre de motivation */}
                  {hasLettre ? (
                    <button
                      onClick={() => handleDownloadLettre(d)}
                      className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 font-bold text-xs text-indigo-700 transition flex items-center gap-1.5 shadow-xs"
                      title="Télécharger la lettre de motivation au format PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Lettre de motivation (PDF)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownloadLettre(d)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 font-bold text-xs text-slate-400 transition flex items-center gap-1.5 shadow-xs"
                      title="Aucune lettre de motivation attachée"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Lettre de motivation</span>
                    </button>
                  )}

                  {/* Action buttons strictly when EN_ATTENTE */}
                  {statut === 'EN_ATTENTE' && (
                    <>
                      <button
                        onClick={() => openRefuseModal(d)}
                        className="px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Refuser</span>
                      </button>

                      <button
                        onClick={() => openAcceptModal(d)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Accepter la demande</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Modal d'acceptation (Création de compte & envoi email) */}
      <Modal
        isOpen={!!demandeToAccept}
        onClose={() => setDemandeToAccept(null)}
        title="Accepter la Candidature et Créer le Compte"
        maxWidth="md"
      >
        {demandeToAccept && (
          <form onSubmit={handleConfirmerAcceptation} className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-1.5">
              <span className="text-emerald-800 font-bold uppercase tracking-wider text-[10px] block">
                Candidat sélectionné
              </span>
              <p className="font-black text-slate-900 text-sm">
                {demandeToAccept.prenom} {demandeToAccept.nom}
              </p>
              <p className="text-slate-600">{demandeToAccept.email}</p>
              <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-emerald-800 font-semibold">
                <span className="bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Vœu statut : <strong>{getStatutSouhaite(demandeToAccept)}</strong>
                </span>
                {demandeToAccept.equipeNom && (
                  <span className="bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    Vœu équipe : <strong>{demandeToAccept.equipeNom}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Statut attribué */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Statut attribué au nouveau membre
              </label>
              <select
                value={selectedStatut}
                onChange={(e) => setSelectedStatut(e.target.value as StatutMembre)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="DOCTORANT">Doctorant</option>
                <option value="ASSOCIE">Chercheur Associé</option>
                <option value="PERMANENT">Membre Permanent</option>
              </select>
            </div>

            {/* Équipe d'affectation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Équipe de recherche d'affectation (Optionnel)
              </label>
              <select
                value={selectedEquipeId}
                onChange={(e) => setSelectedEquipeId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Aucune affectation immédiate</option>
                {equipes.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.acronyme} - {eq.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Explications automatiques */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2">
              <div className="flex items-start gap-2">
                <KeyRound className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Génération de mot de passe :</strong> Un mot de passe aléatoire temporaire et sécurisé sera automatiquement généré.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Notification officielle par email :</strong> Un email officiel élégant avec ses identifiants lui sera expédié à <strong>{demandeToAccept.email}</strong> depuis <em>Laboratoire LIAS - FSBM</em>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Première connexion :</strong> Dès qu'il se connectera au portail, il sera automatiquement invité à modifier son mot de passe.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDemandeToAccept(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={acceptLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{acceptLoading ? 'Création et envoi...' : 'Confirmer l\'acceptation'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 2. Modal de refus (Motif optionnel & envoi email) */}
      <Modal
        isOpen={!!demandeToRefuse}
        onClose={() => setDemandeToRefuse(null)}
        title="Refuser la Candidature d'Adhésion"
        maxWidth="md"
      >
        {demandeToRefuse && (
          <form onSubmit={handleConfirmerRefus} className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200/80 text-xs space-y-1">
              <span className="text-red-800 font-bold uppercase tracking-wider text-[10px] block">
                Candidat concerné
              </span>
              <p className="font-black text-slate-900 text-sm">
                {demandeToRefuse.prenom} {demandeToRefuse.nom}
              </p>
              <p className="text-slate-600">{demandeToRefuse.email}</p>
            </div>

            {/* Motif textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motif du refus <span className="text-slate-400 font-normal">(Optionnel)</span>
              </label>
              <textarea
                rows={4}
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Ex : Dossier ne correspondant pas aux thématiques prioritaires de cette session..."
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              />
            </div>

            {/* Explications email */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Un email de notification officiel sera automatiquement envoyé à l'adresse <strong>{demandeToRefuse.email}</strong> pour l'informer avec courtoisie que sa candidature n'a pas été retenue, en lui précisant le motif ci-dessus s'il est renseigné.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDemandeToRefuse(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={refuseLoading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{refuseLoading ? 'Traitement en cours...' : 'Confirmer le refus'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
