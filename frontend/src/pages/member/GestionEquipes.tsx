import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Users,
  UserCheck,
  ShieldCheck,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Tag,
  FileText,
  Sparkles,
  ArrowRightLeft,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import api from '../../lib/api';
import {
  EquipeDTO,
  MembreResumeDTO,
  DemandeModificationEquipeDTO,
  DemandeChangementEquipeDTO,
  StatutDemande,
} from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { ModalAffectationDirecteEquipe } from '../../components/ModalAffectationDirecteEquipe';
import { useToast } from '../../lib/toastContext';

export const GestionEquipes: React.FC = () => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'equipes' | 'demandes' | 'changements'>('equipes');
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [demandesModif, setDemandesModif] = useState<DemandeModificationEquipeDTO[]>([]);
  const [demandesChangement, setDemandesChangement] = useState<DemandeChangementEquipeDTO[]>([]);
  const [chercheurs, setChercheurs] = useState<MembreResumeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Direct team assignment modal state
  const [isAffectationDirecteOpen, setIsAffectationDirecteOpen] = useState(false);

  // Filter for modification requests
  const [filtreDemandes, setFiltreDemandes] = useState<string>('TOUS');

  // Filter for mobility / changement requests
  const [filtreChangement, setFiltreChangement] = useState<string>('TOUS');

  // Create Team Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createNom, setCreateNom] = useState('');
  const [createAcronyme, setCreateAcronyme] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createAxesInput, setCreateAxesInput] = useState('');
  const [createChefId, setCreateChefId] = useState('');
  const [savingCreate, setSavingCreate] = useState(false);

  // Directeur Direct Edit Team Modal State
  const [editingEquipe, setEditingEquipe] = useState<EquipeDTO | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editThematiques, setEditThematiques] = useState<string[]>([]);
  const [newThematiqueInput, setNewThematiqueInput] = useState('');
  const [savingDirectEdit, setSavingDirectEdit] = useState(false);

  // Change Chef Modal State
  const [teamToChangeChef, setTeamToChangeChef] = useState<EquipeDTO | null>(null);
  const [selectedNewChefId, setSelectedNewChefId] = useState<string>('');
  const [savingNewChef, setSavingNewChef] = useState(false);

  // Refusal Modal State for Modification Request
  const [demandeToRefuse, setDemandeToRefuse] = useState<DemandeModificationEquipeDTO | null>(null);
  const [motifRefus, setMotifRefus] = useState('');
  const [refuseLoading, setRefuseLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Decision States for Changement d'Équipe (Mobilité)
  const [demandeChangementToRefuse, setDemandeChangementToRefuse] = useState<DemandeChangementEquipeDTO | null>(null);
  const [motifRefusChangement, setMotifRefusChangement] = useState('');
  const [refuseChangementLoading, setRefuseChangementLoading] = useState(false);
  const [actionChangementLoadingId, setActionChangementLoadingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eqRes, chRes, demRes, changRes] = await Promise.all([
        api.get<EquipeDTO[]>('/equipes'),
        api.get<{ contenu: MembreResumeDTO[] }>('/membres?statut=PERMANENT&taille=100'),
        api.get<DemandeModificationEquipeDTO[]>('/equipes/demandes-modification'),
        api.get<DemandeChangementEquipeDTO[]>('/equipes/demandes-changement'),
      ]);
      setEquipes(eqRes.data || []);
      setChercheurs(chRes.data?.contenu || []);
      setDemandesModif(demRes.data || []);
      setDemandesChangement(changRes.data || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers for Team Creation (Directeur) ---
  const handleCreateEquipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNom.trim()) return;

    setSavingCreate(true);
    try {
      await api.post('/equipes', {
        nom: createNom.trim(),
        description: createDescription.trim(),
        thematiques: createAxesInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        chefEquipeId: createChefId ? Number(createChefId) : undefined,
      });

      success('Équipe de recherche créée avec succès !');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de la création de l'équipe.");
    } finally {
      setSavingCreate(false);
    }
  };

  // --- Handlers for Direct Edit (Directeur) ---
  const openDirectEditModal = (eq: EquipeDTO) => {
    setEditingEquipe(eq);
    setEditNom(eq.nom);
    setEditDescription(eq.description || '');
    setEditThematiques(eq.thematiques || eq.axesRecherche || []);
    setNewThematiqueInput('');
  };

  const handleAddDirectThematique = () => {
    const trimmed = newThematiqueInput.trim();
    if (trimmed && !editThematiques.includes(trimmed)) {
      setEditThematiques([...editThematiques, trimmed]);
      setNewThematiqueInput('');
    }
  };

  const handleRemoveDirectThematique = (idx: number) => {
    setEditThematiques(editThematiques.filter((_, i) => i !== idx));
  };

  const handleSaveDirectEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipe || !editNom.trim()) return;

    setSavingDirectEdit(true);
    try {
      await api.put(`/equipes/${editingEquipe.id}`, {
        nom: editNom.trim(),
        description: editDescription.trim(),
        thematiques: editThematiques,
      });

      success(`L'équipe « ${editNom} » a été modifiée avec succès.`);
      setEditingEquipe(null);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de la modification de l'équipe.");
    } finally {
      setSavingDirectEdit(false);
    }
  };

  // --- Handlers for Chef's Modification Requests (Directeur approval/refusal) ---
  const handleAccepterDemande = async (demandeId: number) => {
    setActionLoadingId(demandeId);
    try {
      await api.put(`/equipes/demandes-modification/${demandeId}/accepter`);
      success("La demande de modification a été validée et appliquée à l'équipe !");
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de la validation des modifications.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmerRefus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandeToRefuse) return;

    setRefuseLoading(true);
    try {
      await api.put(`/equipes/demandes-modification/${demandeToRefuse.id}/refuser`, {
        motif: motifRefus.trim() || undefined,
      });
      success("La proposition de modification d'équipe a été refusée.");
      setDemandeToRefuse(null);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors du refus de la demande.");
    } finally {
      setRefuseLoading(false);
    }
  };

  // --- Handlers for Changing Chef d'Équipe (Directeur) ---
  const handleChangerChef = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamToChangeChef || !selectedNewChefId) return;

    setSavingNewChef(true);
    try {
      await api.put(`/equipes/${teamToChangeChef.id}/chef`, {
        nouveauChefId: Number(selectedNewChefId),
      });
      success(`Le chef de l'équipe « ${teamToChangeChef.nom} » a été mis à jour avec succès !`);
      setTeamToChangeChef(null);
      setSelectedNewChefId('');
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors du changement du chef d'équipe.");
    } finally {
      setSavingNewChef(false);
    }
  };

  // --- Handlers for Mobility / Changement d'Équipe Requests (Directeur) ---
  const handleAccepterChangement = async (demandeId: number) => {
    setActionChangementLoadingId(demandeId);
    try {
      await api.put(`/equipes/demandes-changement/${demandeId}/accepter`);
      success("La demande de changement d'équipe a été acceptée et appliquée !");
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de l'acceptation de la demande.");
    } finally {
      setActionChangementLoadingId(null);
    }
  };

  const handleConfirmerRefusChangement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandeChangementToRefuse) return;

    setRefuseChangementLoading(true);
    try {
      await api.put(`/equipes/demandes-changement/${demandeChangementToRefuse.id}/refuser`, {
        motif: motifRefusChangement.trim() || undefined,
      });
      success("La demande de changement d'équipe a été refusée.");
      setDemandeChangementToRefuse(null);
      setMotifRefusChangement('');
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors du refus de la demande.");
    } finally {
      setRefuseChangementLoading(false);
    }
  };

  const countEnAttente = demandesModif.filter((d) => d.statut === 'EN_ATTENTE').length;
  const countAcceptees = demandesModif.filter((d) => d.statut === 'ACCEPTEE').length;
  const countRefusees = demandesModif.filter((d) => d.statut === 'REFUSEE').length;

  const countChangementEnAttente = demandesChangement.filter((d) => d.statut === 'EN_ATTENTE').length;
  const countChangementAcceptees = demandesChangement.filter((d) => d.statut === 'ACCEPTEE').length;
  const countChangementRefusees = demandesChangement.filter((d) => d.statut === 'REFUSEE').length;

  const demandesFiltrees = demandesModif.filter((d) => {
    if (filtreDemandes === 'TOUS') return true;
    return d.statut === filtreDemandes;
  });

  const demandesChangementFiltrees = demandesChangement.filter((d) => {
    if (filtreChangement === 'TOUS') return true;
    return d.statut === filtreChangement;
  });

  if (loading) {
    return <LoadingSpinner text="Chargement du module équipes..." />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Gouvernance & Structure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gestion & Modification des Équipes
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Édition directe des informations par la Direction et validation des propositions soumises par les chefs d'équipes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setIsAffectationDirecteOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center gap-2"
            title="Changer ou affecter directement l'équipe d'un membre sans passer par une demande"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Affecter un Membre</span>
          </button>

          <button
            onClick={() => {
              setCreateNom('');
              setCreateAcronyme('');
              setCreateDescription('');
              setCreateAxesInput('');
              setCreateChefId('');
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Équipe</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('equipes')}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'equipes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Équipes de Recherche ({equipes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('demandes')}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'demandes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Modifications d'Équipe ({demandesModif.length})</span>
          {countEnAttente > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center justify-center animate-pulse">
              {countEnAttente}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('changements')}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'changements'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Changements d'Équipe ({demandesChangement.length})</span>
          {countChangementEnAttente > 0 && (
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-black flex items-center justify-center animate-pulse">
              {countChangementEnAttente}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ÉQUIPES GRID */}
      {activeTab === 'equipes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipes.map((eq) => (
            <div
              key={eq.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    {eq.acronyme}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {eq.nombreMembres}
                    </span>
                    {/* Bouton Modifier pour le Directeur */}
                    <button
                      onClick={() => openDirectEditModal(eq)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-slate-600 text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                      title="Modifier directement cette équipe en tant que Directeur"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Éditer</span>
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{eq.nom}</h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {eq.description || 'Aucune description fournie.'}
                </p>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Thématiques / Axes de recherche
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(eq.thematiques || eq.axesRecherche || []).length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">Aucune thématique définie</span>
                    ) : (
                      (eq.thematiques || eq.axesRecherche || []).map((axe, i) => (
                        <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {axe}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                  <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{eq.chefEquipe ? `${eq.chefEquipe.prenom} ${eq.chefEquipe.nom}` : 'Chef non désigné'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTeamToChangeChef(eq);
                    setSelectedNewChefId('');
                  }}
                  className="px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100 hover:border-purple-300 text-purple-700 text-xs font-bold flex items-center gap-1 transition shadow-2xs shrink-0"
                  title="Changer le chef d'équipe avec un membre de cette équipe"
                >
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Changer Chef</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: DEMANDES DE MODIFICATION PAR LES CHEFS D'ÉQUIPES */}
      {activeTab === 'demandes' && (
        <div className="space-y-6">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltreDemandes('TOUS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filtreDemandes === 'TOUS' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Toutes ({demandesModif.length})
            </button>
            <button
              onClick={() => setFiltreDemandes('EN_ATTENTE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                filtreDemandes === 'EN_ATTENTE' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-amber-700'
              }`}
            >
              <span>En attente</span>
              {countEnAttente > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-[10px] text-white flex items-center justify-center font-black">
                  {countEnAttente}
                </span>
              )}
            </button>
            <button
              onClick={() => setFiltreDemandes('ACCEPTEE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                filtreDemandes === 'ACCEPTEE' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-emerald-700'
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
              onClick={() => setFiltreDemandes('REFUSEE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                filtreDemandes === 'REFUSEE' ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-red-700'
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

          {demandesFiltrees.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-800">Aucune demande dans cette catégorie</h2>
              <p className="text-xs text-slate-400 mt-1">
                {filtreDemandes === 'EN_ATTENTE'
                  ? "Toutes les demandes de modification ont été traitées."
                  : "Aucune demande ne correspond au filtre sélectionné."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {demandesFiltrees.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-5 hover:border-slate-300 transition"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {d.equipeAcronyme || 'EQ'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        Équipe : {d.equipeNom}
                      </h3>
                      <span className="text-xs text-slate-400">
                        • Demandée par <strong>{d.demandeurNom}</strong> ({d.demandeurEmail})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={d.statut} />
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(d.dateDemande).toLocaleDateString('fr-FR')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Comparatif (Diff Avant / Après) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Ancien État */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        État actuel au moment de la demande
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block">Nom :</span>
                        <p className="text-slate-800 font-semibold">{d.ancienNom}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block">Description :</span>
                        <p className="text-slate-600 line-clamp-3 italic leading-relaxed">
                          {d.ancienneDescription || 'Aucune description.'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">Thématiques actuelles :</span>
                        <div className="flex flex-wrap gap-1">
                          {(d.anciennesThematiques || []).map((th, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px]">
                              {th}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Nouveau État Proposé */}
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Modifications proposées par le chef</span>
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-blue-700 block">Nouveau nom :</span>
                        <p className={`font-semibold ${d.nouveauNom !== d.ancienNom ? 'text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block' : 'text-slate-800'}`}>
                          {d.nouveauNom}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-blue-700 block">Nouvelle description :</span>
                        <p className="text-slate-700 line-clamp-3 leading-relaxed">
                          {d.nouvelleDescription || 'Aucune description.'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-blue-700 block mb-1">Nouvelles thématiques :</span>
                        <div className="flex flex-wrap gap-1">
                          {(d.nouvellesThematiques || []).map((th, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-medium border border-blue-200">
                              {th}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decision Banners & Actions */}
                  {d.statut === 'EN_ATTENTE' ? (
                    <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setDemandeToRefuse(d);
                          setMotifRefus('');
                        }}
                        className="px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-bold text-xs transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Refuser</span>
                      </button>

                      <button
                        onClick={() => handleAccepterDemande(d.id)}
                        disabled={actionLoadingId === d.id}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{actionLoadingId === d.id ? 'Application...' : 'Accepter & Appliquer à l\'Équipe'}</span>
                      </button>
                    </div>
                  ) : d.statut === 'ACCEPTEE' ? (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Modifications acceptées et appliquées
                        {d.dateDecision && ` le ${new Date(d.dateDecision).toLocaleDateString('fr-FR')}`}
                        {d.decideurNom && ` par ${d.decideurNom}`}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>
                          Modifications refusées
                          {d.dateDecision && ` le ${new Date(d.dateDecision).toLocaleDateString('fr-FR')}`}
                          {d.decideurNom && ` par ${d.decideurNom}`}
                        </span>
                      </div>
                      {d.motifRefus && (
                        <p className="pl-5 text-slate-700 italic">
                          Motif notifié : « {d.motifRefus} »
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEMANDES DE CHANGEMENT D'ÉQUIPE (MOBILITÉ) */}
      {activeTab === 'changements' && (
        <div className="space-y-6">
          {/* Header section inside tab */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/70 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                <ArrowRightLeft className="w-4 h-4" />
                <span>Mobilité & Rattachements des Membres</span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Validation des demandes d'affiliation (sans équipe vers une équipe), de transfert (d'une équipe vers une autre) et de détachement (quitter une équipe) soumises par les doctorants, enseignants-chercheurs et associés.
              </p>
            </div>

            <button
              onClick={() => setIsAffectationDirecteOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              title="Effectuer un rattachement, transfert ou détachement direct sans attendre de demande"
            >
              <UserPlus className="w-4 h-4" />
              <span>Affectation Directe</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltreChangement('TOUS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filtreChangement === 'TOUS' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Toutes ({demandesChangement.length})
            </button>
            <button
              onClick={() => setFiltreChangement('EN_ATTENTE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                filtreChangement === 'EN_ATTENTE' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-purple-700'
              }`}
            >
              <span>En attente</span>
              {countChangementEnAttente > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-700 text-[10px] text-white flex items-center justify-center font-black">
                  {countChangementEnAttente}
                </span>
              )}
            </button>
            <button
              onClick={() => setFiltreChangement('ACCEPTEE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                filtreChangement === 'ACCEPTEE' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span>Acceptées</span>
              {countChangementAcceptees > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-700 text-[10px] text-white flex items-center justify-center font-bold">
                  {countChangementAcceptees}
                </span>
              )}
            </button>
            <button
              onClick={() => setFiltreChangement('REFUSEE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                filtreChangement === 'REFUSEE' ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-red-700'
              }`}
            >
              <span>Refusées</span>
              {countChangementRefusees > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-700 text-[10px] text-white flex items-center justify-center font-bold">
                  {countChangementRefusees}
                </span>
              )}
            </button>
          </div>

          {demandesChangementFiltrees.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-800">Aucune demande de changement d'équipe</h2>
              <p className="text-xs text-slate-400 mt-1">
                {filtreChangement === 'EN_ATTENTE'
                  ? "Toutes les demandes de changement d'équipe ont été traitées."
                  : "Aucune demande ne correspond au filtre sélectionné."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {demandesChangementFiltrees.map((d) => {
                const isRattachement = !d.ancienneEquipeId && !!d.nouvelleEquipeId;
                const isDetachement = !!d.ancienneEquipeId && !d.nouvelleEquipeId;
                const isTransfert = !!d.ancienneEquipeId && !!d.nouvelleEquipeId;

                return (
                  <div
                    key={d.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-4 hover:border-slate-300 transition"
                  >
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Type badge */}
                        {isRattachement && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Rattachement</span>
                          </span>
                        )}
                        {isTransfert && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Transfert d'Équipe</span>
                          </span>
                        )}
                        {isDetachement && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            <UserMinus className="w-3.5 h-3.5 text-amber-600" />
                            <span>Détachement</span>
                          </span>
                        )}

                        <span className="text-sm font-bold text-slate-900">
                          {d.demandeurNom} {d.demandeurPrenom}
                        </span>

                        <span className="text-xs text-slate-500">
                          ({d.demandeurEmail})
                        </span>

                        {d.demandeurStatut && (
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {d.demandeurStatut}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={d.statut} />
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(d.dateDemande).toLocaleDateString('fr-FR')}</span>
                        </span>
                      </div>
                    </div>

                    {/* Visual Mobility Path */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Origin */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Origine :</span>
                          {d.ancienneEquipeNom ? (
                            <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
                              {d.ancienneEquipeNom} {d.ancienneEquipeAcronyme ? `(${d.ancienneEquipeAcronyme})` : ''}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-slate-200 text-xs font-medium text-slate-600 italic">
                              Sans équipe
                            </span>
                          )}
                        </div>

                        <ArrowRight className="w-4 h-4 text-purple-600 shrink-0" />

                        {/* Destination */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cible :</span>
                          {d.nouvelleEquipeNom ? (
                            <span className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-900 shadow-2xs">
                              {d.nouvelleEquipeNom} {d.nouvelleEquipeAcronyme ? `(${d.nouvelleEquipeAcronyme})` : ''}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800 italic">
                              Sans équipe (Détachement)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Justification / Motif */}
                    {d.motif && (
                      <div className="text-xs text-slate-700 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100/80">
                        <span className="font-bold text-blue-900 block mb-0.5">Justification du membre :</span>
                        <p className="italic text-slate-600">« {d.motif} »</p>
                      </div>
                    )}

                    {/* Actions or Decision Status */}
                    {d.statut === 'EN_ATTENTE' ? (
                      <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setDemandeChangementToRefuse(d);
                            setMotifRefusChangement('');
                          }}
                          className="px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-bold text-xs transition flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Refuser</span>
                        </button>

                        <button
                          onClick={() => handleAccepterChangement(d.id)}
                          disabled={actionChangementLoadingId === d.id}
                          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{actionChangementLoadingId === d.id ? 'Traitement...' : 'Accepter & Valider le Changement'}</span>
                        </button>
                      </div>
                    ) : d.statut === 'ACCEPTEE' ? (
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Changement accepté et appliqué
                          {d.dateDecision && ` le ${new Date(d.dateDecision).toLocaleDateString('fr-FR')}`}
                          {d.decideurNom && ` par ${d.decideurNom}`}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>
                            Changement refusé
                            {d.dateDecision && ` le ${new Date(d.dateDecision).toLocaleDateString('fr-FR')}`}
                            {d.decideurNom && ` par ${d.decideurNom}`}
                          </span>
                        </div>
                        {d.motifRefus && (
                          <p className="pl-5 text-slate-700 italic">
                            Motif notifié : « {d.motifRefus} »
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Créer une Équipe (Directeur) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Créer une Équipe de Recherche"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEquipe} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet *</label>
            <input
              type="text"
              value={createNom}
              onChange={(e) => setCreateNom(e.target.value)}
              placeholder="Systèmes Intelligents & Multimédia"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chef d'Équipe (Permanent)</label>
            <select
              value={createChefId}
              onChange={(e) => setCreateChefId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="">Sélectionner un chef d'équipe...</option>
              {chercheurs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.prenom} {c.nom} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Axes / Thématiques (séparés par des virgules)
            </label>
            <input
              type="text"
              value={createAxesInput}
              onChange={(e) => setCreateAxesInput(e.target.value)}
              placeholder="Ex : Vision artificielle, Traitement automatique du langage, IoT"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Missions</label>
            <textarea
              rows={3}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Présentation des objectifs scientifiques de l'équipe..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={savingCreate}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
            >
              {savingCreate ? 'Création...' : 'Créer l\'équipe'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Modifier Directement une Équipe (Directeur) */}
      <Modal
        isOpen={!!editingEquipe}
        onClose={() => setEditingEquipe(null)}
        title={`Modifier l'Équipe ${editingEquipe?.nom || ''}`}
        maxWidth="lg"
      >
        {editingEquipe && (
          <form onSubmit={handleSaveDirectEdit} className="space-y-4">
            <p className="text-xs text-slate-500">
              En tant que <strong>Directeur</strong>, vos modifications sur le nom, la description et les thématiques sont enregistrées immédiatement et définitivement.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom de l'équipe *
              </label>
              <input
                type="text"
                required
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description de l'équipe
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                placeholder="Objectifs et missions scientifiques de l'équipe..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thématiques et Domaines de Recherche (Tags)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newThematiqueInput}
                  onChange={(e) => setNewThematiqueInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDirectThematique();
                    }
                  }}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex : Apprentissage Profond, IoT, Cybersécurité..."
                />
                <button
                  type="button"
                  onClick={handleAddDirectThematique}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  Ajouter
                </button>
              </div>

              {/* Tags preview */}
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 min-h-[44px]">
                {editThematiques.length === 0 ? (
                  <span className="text-xs text-slate-400">Aucun tag ajouté.</span>
                ) : (
                  editThematiques.map((th, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200 flex items-center gap-1.5"
                    >
                      <span>{th}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDirectThematique(idx)}
                        className="text-blue-500 hover:text-blue-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingEquipe(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingDirectEdit}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                {savingDirectEdit ? 'Enregistrement...' : 'Enregistrer immédiatement'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: Refuser une Demande de Modification */}
      <Modal
        isOpen={!!demandeToRefuse}
        onClose={() => setDemandeToRefuse(null)}
        title="Refuser la Demande de Modification"
        maxWidth="md"
      >
        {demandeToRefuse && (
          <form onSubmit={handleConfirmerRefus} className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200/80 text-xs space-y-1">
              <span className="text-red-800 font-bold uppercase tracking-wider text-[10px] block">
                Équipe concernée
              </span>
              <p className="font-black text-slate-900 text-sm">
                {demandeToRefuse.equipeNom}
              </p>
              <p className="text-slate-600">
                Demandeur : {demandeToRefuse.demandeurNom} ({demandeToRefuse.demandeurEmail})
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motif du refus <span className="text-slate-400 font-normal">(Optionnel)</span>
              </label>
              <textarea
                rows={4}
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Ex : Description non conforme aux axes stratégiques du laboratoire, appellation inadéquate..."
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Le chef d'équipe recevra une notification pour l'informer du refus avec le motif spécifié.
              </span>
            </div>

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
                <span>{refuseLoading ? 'Traitement...' : 'Confirmer le refus'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4: Changer le Chef d'Équipe (Directeur) */}
      <Modal
        isOpen={!!teamToChangeChef}
        onClose={() => setTeamToChangeChef(null)}
        title={`Désigner le Chef d'Équipe — ${teamToChangeChef?.nom || ''}`}
        maxWidth="md"
      >
        {teamToChangeChef && (
          <form onSubmit={handleChangerChef} className="space-y-4">
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs space-y-1.5">
              <span className="text-purple-800 font-bold uppercase tracking-wider text-[10px] block">
                Chef Actuel
              </span>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  {teamToChangeChef.chefEquipe
                    ? `${teamToChangeChef.chefEquipe.prenom} ${teamToChangeChef.chefEquipe.nom}`
                    : 'Aucun chef désigné'}
                </span>
                {teamToChangeChef.chefEquipe?.email && (
                  <span className="text-xs font-normal text-slate-500">
                    ({teamToChangeChef.chefEquipe.email})
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nouveau Chef d'Équipe <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Sélectionnez un membre appartenant à cette équipe ({teamToChangeChef.membres?.length || 0} membre{(teamToChangeChef.membres?.length || 0) > 1 ? 's' : ''}) :
              </p>

              {(!teamToChangeChef.membres || teamToChangeChef.membres.length === 0) ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Cette équipe ne compte actuellement aucun membre rattaché dans la base pour être désigné chef.
                  </span>
                </div>
              ) : (
                <select
                  value={selectedNewChefId}
                  onChange={(e) => setSelectedNewChefId(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="">-- Choisir un membre de l'équipe --</option>
                  {teamToChangeChef.membres.map((m) => {
                    const isCurrent = m.id === teamToChangeChef.chefEquipe?.id;
                    return (
                      <option key={m.id} value={m.id} disabled={isCurrent}>
                        {m.prenom} {m.nom} ({m.email}) {m.statut ? `• ${m.statut}` : ''} {isCurrent ? '— [Chef actuel]' : ''}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">Règle statutaire :</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                La désignation clôturera le mandat de chef d'équipe précédent et affectera le nouveau membre en tant que chef de l'équipe avec notification automatique.
              </p>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTeamToChangeChef(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingNewChef || !selectedNewChefId}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>{savingNewChef ? 'Enregistrement...' : 'Valider le nouveau chef'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 5: Refuser une Demande de Changement d'Équipe */}
      <Modal
        isOpen={!!demandeChangementToRefuse}
        onClose={() => setDemandeChangementToRefuse(null)}
        title="Refuser la Demande de Changement d'Équipe"
        maxWidth="md"
      >
        {demandeChangementToRefuse && (
          <form onSubmit={handleConfirmerRefusChangement} className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200/80 text-xs space-y-1.5">
              <span className="text-red-800 font-bold uppercase tracking-wider text-[10px] block">
                Demandeur
              </span>
              <p className="font-black text-slate-900 text-sm">
                {demandeChangementToRefuse.demandeurNom} {demandeChangementToRefuse.demandeurPrenom}
              </p>
              <p className="text-slate-600">
                {demandeChangementToRefuse.demandeurEmail} {demandeChangementToRefuse.demandeurStatut ? `• ${demandeChangementToRefuse.demandeurStatut}` : ''}
              </p>
              <div className="mt-2 pt-2 border-t border-red-200/70 text-slate-700">
                <strong>Changement concerné : </strong>
                {demandeChangementToRefuse.ancienneEquipeNom || 'Sans équipe'} ➔{' '}
                {demandeChangementToRefuse.nouvelleEquipeNom || 'Sans équipe'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motif du refus <span className="text-slate-400 font-normal">(Optionnel)</span>
              </label>
              <textarea
                rows={4}
                value={motifRefusChangement}
                onChange={(e) => setMotifRefusChangement(e.target.value)}
                placeholder="Ex : Capacité d'encadrement de l'équipe atteinte, profil scientifique non aligné avec les axes thématiques..."
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Le membre recevra une notification avec la décision de la direction et le motif fourni.
              </span>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDemandeChangementToRefuse(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={refuseChangementLoading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{refuseChangementLoading ? 'Traitement...' : 'Confirmer le refus'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 6: Affectation Directe d'un Membre (Direction) */}
      <ModalAffectationDirecteEquipe
        isOpen={isAffectationDirecteOpen}
        onClose={() => setIsAffectationDirecteOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};
