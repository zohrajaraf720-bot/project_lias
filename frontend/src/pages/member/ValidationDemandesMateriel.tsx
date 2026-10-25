import React, { useEffect, useState } from 'react';
import {
  Package,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Clock,
  Users,
  CheckSquare,
  HelpCircle,
  ArrowRight,
  Plus,
  Search,
  Building2,
  Sparkles,
  Check,
} from 'lucide-react';
import api from '../../lib/api';
import {
  DemandeMaterielDTO,
  MaterielDTO,
  AttributionMaterielDTO,
  MembreInterneDTO,
  PageDTO,
  EquipeDTO,
} from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toastContext';

export const ValidationDemandesMateriel: React.FC = () => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'demandes' | 'qui_a_recu' | 'qui_na_pas_recu'>('demandes');
  const [demandes, setDemandes] = useState<DemandeMaterielDTO[]>([]);
  const [materiels, setMateriels] = useState<MaterielDTO[]>([]);
  const [attributions, setAttributions] = useState<AttributionMaterielDTO[]>([]);
  const [membresNonEquipes, setMembresNonEquipes] = useState<MembreInterneDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Validation Modal
  const [selectedDemande, setSelectedDemande] = useState<DemandeMaterielDTO | null>(null);
  const [materielId, setMaterielId] = useState<string>('');
  const [commentaire, setCommentaire] = useState('');
  const [saving, setSaving] = useState(false);

  // Refusal Modal
  const [demandeToRefuse, setDemandeToRefuse] = useState<DemandeMaterielDTO | null>(null);
  const [motifRefus, setMotifRefus] = useState('');
  const [refuseLoading, setRefuseLoading] = useState(false);

  // Return Modal
  const [demandeToReturn, setDemandeToReturn] = useState<DemandeMaterielDTO | null>(null);
  const [returnLoading, setReturnLoading] = useState(false);

  // Direct Distribution Modal State (Directeur)
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [distribMaterielId, setDistribMaterielId] = useState<string>('');
  const [distribMode, setDistribMode] = useState<'MEMBRES' | 'EQUIPE'>('MEMBRES');
  const [distribSelectedMembres, setDistribSelectedMembres] = useState<number[]>([]);
  const [distribEquipeId, setDistribEquipeId] = useState<string>('');
  const [distribQuantiteParMembre, setDistribQuantiteParMembre] = useState<number>(1);
  const [distribMotif, setDistribMotif] = useState('');
  const [distribLoading, setDistribLoading] = useState(false);
  const [membreSearchQuery, setMembreSearchQuery] = useState('');
  const [tousMembres, setTousMembres] = useState<MembreInterneDTO[]>([]);
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [demRes, matRes, attrRes, nonEqRes, eqRes, allMembresRes] = await Promise.all([
        api.get<PageDTO<DemandeMaterielDTO>>('/materiel/demandes'),
        api.get<MaterielDTO[]>('/materiel/stock'),
        api.get<AttributionMaterielDTO[]>('/materiel/attributions').catch(() => ({ data: [] })),
        api.get<MembreInterneDTO[]>('/materiel/membres-non-equipes').catch(() => ({ data: [] })),
        api.get<EquipeDTO[]>('/equipes').catch(() => ({ data: [] })),
        api.get<PageDTO<MembreInterneDTO>>('/membres?etatCompte=ACTIF&taille=200').catch(() => ({ data: { contenu: [] } })),
      ]);
      setDemandes(demRes.data?.contenu || []);
      setMateriels(matRes.data || []);
      setAttributions(attrRes.data || []);
      setMembresNonEquipes(nonEqRes.data || []);
      setEquipes(eqRes.data || []);
      setTousMembres(allMembresRes.data?.contenu || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const resetDistribForm = () => {
    setDistribMaterielId('');
    setDistribMode('MEMBRES');
    setDistribSelectedMembres([]);
    setDistribEquipeId('');
    setDistribQuantiteParMembre(1);
    setDistribMotif('');
    setMembreSearchQuery('');
  };

  const openDistributionModal = (preselectedMembreId?: number) => {
    resetDistribForm();
    if (preselectedMembreId) {
      setDistribMode('MEMBRES');
      setDistribSelectedMembres([preselectedMembreId]);
    }
    const firstDispo = materiels.find((m) => m.quantiteDisponible > 0);
    if (firstDispo) {
      setDistribMaterielId(String(firstDispo.id));
    }
    setIsDistributeModalOpen(true);
  };

  const handleToggleMembre = (id: number) => {
    if (distribSelectedMembres.includes(id)) {
      setDistribSelectedMembres(distribSelectedMembres.filter((mid) => mid !== id));
    } else {
      setDistribSelectedMembres([...distribSelectedMembres, id]);
    }
  };

  const handleSelectAllNonEquipes = () => {
    const nonEquipesIds = membresNonEquipes.map((m) => m.id);
    setDistribSelectedMembres(Array.from(new Set([...distribSelectedMembres, ...nonEquipesIds])));
  };

  const handleSelectAllFiltered = () => {
    setDistribSelectedMembres(filteredMembres.map((m) => m.id));
  };

  const handleDeselectAll = () => {
    setDistribSelectedMembres([]);
  };

  const handleDistribuerGroupe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distribMaterielId) {
      error('Veuillez sélectionner un équipement en stock.');
      return;
    }

    const mat = materiels.find((m) => m.id === Number(distribMaterielId));
    if (!mat) {
      error('Matériel sélectionné invalide.');
      return;
    }

    let count = 0;
    if (distribMode === 'EQUIPE') {
      if (!distribEquipeId) {
        error('Veuillez sélectionner une équipe.');
        return;
      }
      const eqMembres = tousMembres.filter((m) => m.equipeId === Number(distribEquipeId));
      count = eqMembres.length;
      if (count === 0) {
        error('Aucun membre actif trouvé dans cette équipe.');
        return;
      }
    } else {
      if (distribSelectedMembres.length === 0) {
        error('Veuillez sélectionner au moins un membre bénéficiaire.');
        return;
      }
      count = distribSelectedMembres.length;
    }

    const qtyParMembre = Number(distribQuantiteParMembre) || 1;
    const totalRequis = count * qtyParMembre;
    if (totalRequis > mat.quantiteDisponible) {
      error(`Stock insuffisant : requis ${totalRequis} unité(s), disponible : ${mat.quantiteDisponible}.`);
      return;
    }

    setDistribLoading(true);
    try {
      await api.post('/materiel/distribuer-groupe', {
        materielId: Number(distribMaterielId),
        mode: distribMode,
        membreIds: distribMode === 'MEMBRES' ? distribSelectedMembres : undefined,
        equipeId: distribMode === 'EQUIPE' ? Number(distribEquipeId) : undefined,
        quantiteParMembre: qtyParMembre,
        motif: distribMotif.trim() || undefined,
      });

      success(`Dotation effectuée avec succès ! ${count} membre(s) ont reçu ${qtyParMembre} unité(s) chacun.`);
      setIsDistributeModalOpen(false);
      resetDistribForm();
      fetchAllData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la distribution du matériel.');
    } finally {
      setDistribLoading(false);
    }
  };

  const handleValider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemande || !materielId) {
      error('Veuillez sélectionner un équipement disponible dans le stock.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/materiel/demandes/${selectedDemande.id}/valider`, {
        materielId: Number(materielId),
        commentaire: commentaire.trim() || undefined,
      });

      success('La demande a été validée et le matériel a été attribué avec succès.');
      setSelectedDemande(null);
      fetchAllData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la validation.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmerRefus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandeToRefuse) return;

    setRefuseLoading(true);
    try {
      await api.put(`/materiel/demandes/${demandeToRefuse.id}/refuser`, {
        commentaire: motifRefus.trim() || 'Demande non retenue par la Direction.',
      });
      success('La demande de matériel a été refusée.');
      setDemandeToRefuse(null);
      fetchAllData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors du refus de la demande.');
    } finally {
      setRefuseLoading(false);
    }
  };

  const handleConfirmerRetour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandeToReturn) return;

    setReturnLoading(true);
    try {
      await api.put(`/materiel/demandes/${demandeToReturn.id}/retourner`);
      success('Le matériel a été retourné au stock disponible avec succès !');
      setDemandeToReturn(null);
      fetchAllData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de l\'enregistrement du retour.');
    } finally {
      setReturnLoading(false);
    }
  };

  const filteredMembres = tousMembres.filter((m) => {
    if (!membreSearchQuery.trim()) return true;
    const q = membreSearchQuery.toLowerCase();
    const fullName = `${m.prenom} ${m.nom}`.toLowerCase();
    const email = (m.email || '').toLowerCase();
    const team = (m.equipeNom || '').toLowerCase();
    return fullName.includes(q) || email.includes(q) || team.includes(q);
  });

  const selectedEquipeMembres = distribEquipeId
    ? tousMembres.filter((m) => m.equipeId === Number(distribEquipeId))
    : [];

  const selectedMateriel = materiels.find((m) => m.id === Number(distribMaterielId));
  const countBeneficiaires =
    distribMode === 'EQUIPE' ? selectedEquipeMembres.length : distribSelectedMembres.length;
  const totalQuantiteRequise = countBeneficiaires * (distribQuantiteParMembre || 1);
  const stockDisponible = selectedMateriel?.quantiteDisponible || 0;
  const isStockInsuffisant = totalQuantiteRequise > stockDisponible;

  if (loading) {
    return <LoadingSpinner text="Chargement du module de gestion du matériel..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Gouvernance Matériel & Distribution Équitable</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gestion du Parc & Distribution du Matériel
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Suivi des besoins scientifiques, contrôle des arrivages, distribution équitable et traçabilité des dotations.
          </p>
        </div>

        <button
          onClick={() => openDistributionModal()}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Distribuer du Matériel</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('demandes')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'demandes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Demandes & Emprunts ({demandes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('qui_a_recu')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'qui_a_recu'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Qui a reçu quoi ({attributions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('qui_na_pas_recu')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'qui_na_pas_recu'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Qui n'a pas reçu ({membresNonEquipes.length})</span>
        </button>
      </div>

      {/* Tab 1: Demandes de matériel */}
      {activeTab === 'demandes' && (
        <div className="space-y-4">
          {demandes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-800">Aucune demande de matériel enregistrée</h2>
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
                      <span className="text-xs text-slate-400">
                        Demandé par <strong>{d.demandeur?.prenom} {d.demandeur?.nom}</strong>
                      </span>
                      <span className="text-xs text-slate-400">
                        • {new Date(d.dateSoumission).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {d.descriptionBesoin}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <div>Quantité demandée : <strong className="text-slate-800">{d.quantite}</strong></div>
                      {d.materielAttribue && (
                        <div className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                          Attribué : {d.materielAttribue}
                        </div>
                      )}
                      {d.commentaireDirection && (
                        <div className="text-slate-600 italic">Direction : "{d.commentaireDirection}"</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {d.statut === 'EN_ATTENTE' && (
                      <>
                        <button
                          onClick={() => {
                            setDemandeToRefuse(d);
                            setMotifRefus('');
                          }}
                          className="px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-bold text-xs transition"
                        >
                          Refuser
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDemande(d);
                            setMaterielId('');
                            setCommentaire('');
                          }}
                          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                        >
                          Attribuer Matériel
                        </button>
                      </>
                    )}

                    {d.statut === 'VALIDEE' && (
                      <button
                        onClick={() => setDemandeToReturn(d)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Enregistrer le Retour</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Qui a reçu quoi */}
      {activeTab === 'qui_a_recu' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800">
            <strong>Historique complet des dotations :</strong> Ce tableau assure la traçabilité intégrale de tous les équipements distribués aux membres du LIAS avec l'historique des retours.
          </div>

          {attributions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h2 className="text-base font-bold text-slate-800">Aucune attribution de matériel effectuée</h2>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Bénéficiaire</th>
                    <th className="px-5 py-3.5">Équipement Attribué</th>
                    <th className="px-5 py-3.5">Quantité</th>
                    <th className="px-5 py-3.5">Date de distribution</th>
                    <th className="px-5 py-3.5">État du prêt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attributions.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {a.beneficiaire?.prenom} {a.beneficiaire?.nom}
                        <div className="text-[11px] text-slate-400 font-normal">{a.beneficiaire?.email}</div>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {a.materielDesignation}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {a.quantiteAttribuee} unité(s)
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(a.dateDistribution).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-5 py-4">
                        {a.dateRetour ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Retourné le {new Date(a.dateRetour).toLocaleDateString('fr-FR')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            En cours d'utilisation
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Qui n'a pas reçu */}
      {activeTab === 'qui_na_pas_recu' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900">
            <strong>Indicateur d'équité de distribution :</strong> Liste des chercheurs et doctorants actifs du laboratoire n'ayant encore reçu aucune dotation matérielle. Priorisez ces membres lors des prochains arrivages.
          </div>

          {membresNonEquipes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-800">Distribution équitable optimale</h2>
              <p className="text-xs text-slate-500 mt-1">Tous les membres actifs du laboratoire sont actuellement équipés.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {membresNonEquipes.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={m.statut} />
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                        En attente de dotation
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm pt-2">
                      {m.prenom} {m.nom}
                    </h3>
                    <div className="text-xs text-slate-500">{m.email}</div>
                    {m.equipeNom && (
                      <div className="text-xs text-slate-400">Équipe : {m.equipeNom}</div>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => openDistributionModal(m.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Dotation directe</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Validation Modal */}
      <Modal
        isOpen={!!selectedDemande}
        onClose={() => setSelectedDemande(null)}
        title="Attribuer un Équipement du Stock"
        maxWidth="md"
      >
        {selectedDemande && (
          <form onSubmit={handleValider} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 block font-semibold mb-1">Besoin exprimé :</span>
              <p className="text-slate-800 font-medium">{selectedDemande.descriptionBesoin}</p>
              <span className="text-slate-500 text-[11px] block mt-1">
                Demandeur : {selectedDemande.demandeur?.prenom} {selectedDemande.demandeur?.nom} • Quantité : {selectedDemande.quantite}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sélectionner l'équipement disponible en stock *
              </label>
              <select
                value={materielId}
                onChange={(e) => setMaterielId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                required
              >
                <option value="">Sélectionner un matériel...</option>
                {materiels
                  .filter((m) => m.quantiteDisponible > 0)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.designation || m.nom} - {m.quantiteDisponible} dispo. (Arrivage : {m.dateArrivage || 'N/A'})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Commentaire de la Direction (Optionnel)
              </label>
              <input
                type="text"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Ex : Prêt scientifique accordé pour les travaux de recherche..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDemande(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                {saving ? 'Validation...' : 'Confirmer l\'attribution'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Refusal Modal */}
      <Modal
        isOpen={!!demandeToRefuse}
        onClose={() => setDemandeToRefuse(null)}
        title="Refuser la Demande de Matériel"
        maxWidth="md"
      >
        {demandeToRefuse && (
          <form onSubmit={handleConfirmerRefus} className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200/80 text-xs space-y-1.5">
              <span className="text-red-800 font-bold uppercase tracking-wider text-[10px] block">
                Demande concernée
              </span>
              <p className="font-black text-slate-900 text-sm">
                {demandeToRefuse.demandeur?.prenom} {demandeToRefuse.demandeur?.nom}
              </p>
              <p className="text-slate-600">
                Besoin : <strong>{demandeToRefuse.descriptionBesoin}</strong> (Quantité : {demandeToRefuse.quantite})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motif du refus (Optionnel)
              </label>
              <textarea
                rows={3}
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Ex : Stock épuisé, besoin non prioritaire pour cette session..."
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDemandeToRefuse(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={refuseLoading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                {refuseLoading ? 'Traitement...' : 'Confirmer le refus'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Return Confirmation Modal */}
      <Modal
        isOpen={!!demandeToReturn}
        onClose={() => setDemandeToReturn(null)}
        title="Enregistrer le Retour du Matériel"
        maxWidth="md"
      >
        {demandeToReturn && (
          <form onSubmit={handleConfirmerRetour} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                Équipement à réintégrer
              </span>
              <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{demandeToReturn.materielAttribue || demandeToReturn.descriptionBesoin}</span>
              </div>
              <div className="text-slate-600 space-y-1 pt-2 border-t border-slate-200/60">
                <div>
                  Bénéficiaire :{' '}
                  <strong className="text-slate-800">
                    {demandeToReturn.demandeur?.prenom} {demandeToReturn.demandeur?.nom}
                  </strong>
                </div>
                <div>
                  Quantité demandée : <strong className="text-slate-800">{demandeToReturn.quantite} unité(s)</strong>
                </div>
                {demandeToReturn.descriptionBesoin && (
                  <div className="text-slate-500 italic">
                    Besoin initial : "{demandeToReturn.descriptionBesoin}"
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/70 text-xs text-blue-900 flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Confirmez-vous le retour effectif de cet équipement au stock du laboratoire ? Une fois confirmé, la dotation sera clôturée et l'équipement redeviendra disponible pour attribution.
              </p>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDemandeToReturn(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={returnLoading}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${returnLoading ? 'animate-spin' : ''}`} />
                <span>{returnLoading ? 'Enregistrement...' : 'Confirmer le retour'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Direct Distribution Modal (Directeur) */}
      <Modal
        isOpen={isDistributeModalOpen}
        onClose={() => setIsDistributeModalOpen(false)}
        title="Distribution Directe de Matériel"
        maxWidth="2xl"
      >
        <form onSubmit={handleDistribuerGroupe} className="space-y-5">
          {/* 1. Sélection du matériel en stock */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Sélectionner l'équipement en stock <span className="text-rose-500">*</span>
            </label>
            <select
              value={distribMaterielId}
              onChange={(e) => setDistribMaterielId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">-- Choisissez un matériel disponible --</option>
              {materiels
                .filter((m) => m.quantiteDisponible > 0)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.designation || m.nom} — {m.quantiteDisponible} unité(s) disponible(s) (Arrivage : {m.dateArrivage || 'N/A'})
                  </option>
                ))}
            </select>
            {selectedMateriel && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span>Stock disponible actuellement : <strong className="text-slate-800">{selectedMateriel.quantiteDisponible} unité(s)</strong></span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  En Stock
                </span>
              </div>
            )}
          </div>

          {/* 2. Mode de ciblage : Membres ou Équipe */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. Cible de la dotation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDistribMode('MEMBRES')}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2.5 ${
                  distribMode === 'MEMBRES'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className={`w-4 h-4 ${distribMode === 'MEMBRES' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <div>Chercheurs & Doctorants</div>
                  <div className="text-[10px] font-normal text-slate-400">1 ou plusieurs membres au choix</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDistribMode('EQUIPE')}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2.5 ${
                  distribMode === 'EQUIPE'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className={`w-4 h-4 ${distribMode === 'EQUIPE' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <div>Toute une Équipe</div>
                  <div className="text-[10px] font-normal text-slate-400">Distribuer à tous les membres de l'équipe</div>
                </div>
              </button>
            </div>
          </div>

          {/* Mode EQUIPE : Choix de l'équipe */}
          {distribMode === 'EQUIPE' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sélectionner l'équipe de recherche <span className="text-rose-500">*</span>
                </label>
                <select
                  value={distribEquipeId}
                  onChange={(e) => setDistribEquipeId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">-- Choisissez une équipe --</option>
                  {equipes.map((eq) => {
                    const membersCount = tousMembres.filter((m) => m.equipeId === eq.id).length;
                    return (
                      <option key={eq.id} value={eq.id}>
                        {eq.nom} {eq.acronyme ? `(${eq.acronyme})` : ''} — {membersCount} membre(s)
                      </option>
                    );
                  })}
                </select>
              </div>

              {distribEquipeId && (
                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Membres actifs concernés ({selectedEquipeMembres.length}) :</span>
                    {selectedEquipeMembres.length === 0 && (
                      <span className="text-rose-500 text-[11px]">Aucun membre actif dans cette équipe</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {selectedEquipeMembres.map((m) => (
                      <span
                        key={m.id}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{m.prenom} {m.nom}</span>
                        <span className="text-[10px] text-slate-400">({m.statut})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode MEMBRES : Sélection de membres */}
          {distribMode === 'MEMBRES' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700">
                  Sélectionner les chercheurs / doctorants ({distribSelectedMembres.length} sélectionné(s))
                </label>
                <div className="flex items-center gap-1.5">
                  {membresNonEquipes.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllNonEquipes}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold transition"
                      title="Sélectionner tous les membres n'ayant reçu aucune dotation"
                    >
                      Sans dotation ({membresNonEquipes.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold transition"
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold transition"
                  >
                    Effacer
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={membreSearchQuery}
                  onChange={(e) => setMembreSearchQuery(e.target.value)}
                  placeholder="Filtrer par nom, prénom ou équipe..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Scrollable list */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 p-2">
                {filteredMembres.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Aucun membre ne correspond à votre recherche.
                  </div>
                ) : (
                  filteredMembres.map((m) => {
                    const isSelected = distribSelectedMembres.includes(m.id);
                    const isNonEquipe = membresNonEquipes.some((ne) => ne.id === m.id);

                    return (
                      <label
                        key={m.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isSelected ? 'bg-blue-50/70 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleMembre(m.id)}
                            className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-xs font-bold leading-snug">
                              {m.prenom} {m.nom}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {m.email} {m.equipeNom ? `• ${m.equipeNom}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isNonEquipe && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Sans dotation
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {m.statut}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 3. Quantité par membre */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                3. Quantité attribuée à chaque membre <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDistribQuantiteParMembre(val)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition ${
                      distribQuantiteParMembre === val
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {val} chacun
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min={1}
              value={distribQuantiteParMembre}
              onChange={(e) => setDistribQuantiteParMembre(Math.max(1, Number(e.target.value) || 1))}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          {/* 4. Motif / Commentaire */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              4. Motif ou contexte de la dotation (Optionnel)
            </label>
            <input
              type="text"
              value={distribMotif}
              onChange={(e) => setDistribMotif(e.target.value)}
              placeholder="Ex : Dotation annuelle laboratoire, rentrée scientifique, équipement projet..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Live Calculation & Stock Preview */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 transition ${
              isStockInsuffisant
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : countBeneficiaires > 0
                ? 'bg-blue-50/70 border-blue-200/80 text-blue-900'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Bilan de l'opération :</span>
              </span>
              <span>
                {countBeneficiaires} bénéficiaire(s) × {distribQuantiteParMembre} unité(s) ={' '}
                <strong className="text-sm">{totalQuantiteRequise} unité(s) requise(s)</strong>
              </span>
            </div>

            {selectedMateriel && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <div>Stock actuel : <strong>{stockDisponible}</strong></div>
                {isStockInsuffisant ? (
                  <div className="text-rose-700 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Stock insuffisant (manque {totalQuantiteRequise - stockDisponible} unité(s))</span>
                  </div>
                ) : (
                  <div className="text-emerald-700 font-semibold">
                    ✓ Stock suffisant (Restant : {stockDisponible - totalQuantiteRequise} unité(s))
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer action buttons */}
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDistributeModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={
                distribLoading ||
                !distribMaterielId ||
                countBeneficiaires === 0 ||
                isStockInsuffisant
              }
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Package className={`w-4 h-4 ${distribLoading ? 'animate-spin' : ''}`} />
              <span>
                {distribLoading
                  ? 'Distribution en cours...'
                  : `Distribuer ${totalQuantiteRequise > 0 ? `(${totalQuantiteRequise} unité${totalQuantiteRequise > 1 ? 's' : ''})` : ''}`}
              </span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
