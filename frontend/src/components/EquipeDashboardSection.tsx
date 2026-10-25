import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  MessageSquare,
  Sparkles,
  Layers,
  ExternalLink,
  Edit3,
  TrendingUp,
  Mail,
  Shield,
  FileText,
  ChevronRight,
  PlusCircle,
  Tag,
  CheckCircle2,
  Clock,
  XCircle,
  History,
  AlertCircle,
  Info,
  ArrowLeftRight,
} from 'lucide-react';
import api from '../lib/api';
import { EquipeDetailDTO, MembreResumeDTO, PublicationDTO, DemandeModificationEquipeDTO } from '../types';
import { RoleBadge } from './RoleBadge';
import { Avatar } from './Avatar';
import { Modal } from './Modal';
import { ModalChangementEquipe } from './ModalChangementEquipe';
import { useToast } from '../lib/toastContext';
import { useAuth } from '../lib/authContext';

interface EquipeDashboardSectionProps {
  equipeId?: number;
  equipeNom?: string;
  isChefEquipe?: boolean;
}

export const EquipeDashboardSection: React.FC<EquipeDashboardSectionProps> = ({
  equipeId,
  equipeNom,
  isChefEquipe = false,
}) => {
  const navigate = useNavigate();
  const { user, isChefEquipe: authIsChefEquipe } = useAuth();
  const { success, error } = useToast();

  const [equipe, setEquipe] = useState<EquipeDetailDTO | null>(null);
  const [demandesModif, setDemandesModif] = useState<DemandeModificationEquipeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'permanents' | 'doctorants'>('all');

  // Edit Team Modal State (for Chef d'équipe)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNom, setEditNom] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editThematiques, setEditThematiques] = useState<string[]>([]);
  const [newThematiqueInput, setNewThematiqueInput] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // History Modal State (for Chef d'équipe)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Team Mobility Modal State (for all members)
  const [isChangementEquipeModalOpen, setIsChangementEquipeModalOpen] = useState(false);

  const fetchEquipeAndDemandes = async () => {
    if (!equipeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [resEquipe, resDemandes] = await Promise.all([
        api.get<EquipeDetailDTO>(`/equipes/${equipeId}`),
        api.get<DemandeModificationEquipeDTO[]>(`/equipes/${equipeId}/demandes-modification`).catch(() => ({ data: [] })),
      ]);
      setEquipe(resEquipe.data);
      setEditNom(resEquipe.data.nom || '');
      setEditDescription(resEquipe.data.description || '');
      setEditThematiques(resEquipe.data.thematiques || resEquipe.data.axesRecherche || []);
      setDemandesModif(resDemandes.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'équipe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipeAndDemandes();
  }, [equipeId]);

  if (!equipeId || (!loading && !equipe)) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-4 gap-4">
          <div className="h-20 bg-slate-100 rounded-2xl"></div>
          <div className="h-20 bg-slate-100 rounded-2xl"></div>
          <div className="h-20 bg-slate-100 rounded-2xl"></div>
          <div className="h-20 bg-slate-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const membres = equipe?.membres || [];
  const publications = equipe?.publications || [];

  const chef = equipe?.chefActuel || equipe?.chefEquipe || membres.find((m) =>
    (m.roleLibelle || '').toLowerCase().includes('chef')
  );

  const isUserChef = Boolean(
    isChefEquipe ||
    authIsChefEquipe ||
    (user?.id != null && chef?.id != null && user.id === chef.id) ||
    (user?.id != null && equipe?.chefEquipe?.id != null && user.id === equipe.chefEquipe.id) ||
    (user?.id != null && equipe?.chefActuel?.id != null && user.id === equipe.chefActuel.id)
  );

  const permanents = membres.filter((m) => m.statut === 'PERMANENT');
  const doctorants = membres.filter((m) => m.statut === 'DOCTORANT');

  const displayedMembres =
    activeTab === 'permanents'
      ? permanents
      : activeTab === 'doctorants'
      ? doctorants
      : membres;

  // Publications statistics
  const currentYear = new Date().getFullYear();
  const pubsThisYear = publications.filter((p) => p.annee === currentYear).length;
  const pubsRecent = publications.filter((p) => p.annee >= currentYear - 1).length;

  // Yearly distribution for histogram
  const yearsMap = publications.reduce<Record<number, number>>((acc, pub) => {
    acc[pub.annee] = (acc[pub.annee] || 0) + 1;
    return acc;
  }, {});

  const sortedYears = Object.keys(yearsMap)
    .map(Number)
    .sort((a, b) => b - a);

  const maxPubsInAYear = Math.max(...Object.values(yearsMap), 1);

  // Thematics / Research axes
  const thematiques = equipe?.thematiques || equipe?.axesRecherche || [];

  // Pending modification request submitted by chef
  const pendingDemande = demandesModif.find((d) => d.statut === 'EN_ATTENTE');

  // Handle Edit Team Presentation Submit (Chef d'équipe)
  const handleSavePresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipe) return;
    if (!editNom.trim()) {
      error("Le nom de l'équipe ne peut pas être vide.");
      return;
    }

    try {
      setSavingEdit(true);
      await api.post(`/equipes/${equipe.id}/demandes-modification`, {
        nom: editNom.trim(),
        description: editDescription.trim(),
        thematiques: editThematiques,
      });

      success('Votre proposition de modification a été envoyée à la Direction pour validation.');
      setIsEditModalOpen(false);

      // Refresh requests history
      const demRes = await api.get<DemandeModificationEquipeDTO[]>(`/equipes/${equipe.id}/demandes-modification`).catch(() => ({ data: [] }));
      setDemandesModif(demRes.data || []);
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la soumission de la demande');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddThematique = () => {
    const trimmed = newThematiqueInput.trim();
    if (trimmed && !editThematiques.includes(trimmed)) {
      setEditThematiques([...editThematiques, trimmed]);
      setNewThematiqueInput('');
    }
  };

  const handleRemoveThematique = (idx: number) => {
    setEditThematiques(editThematiques.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-8 mt-4">
      {/* 1. ENCART DE L'ÉQUIPE (Showcase Card) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-7 sm:p-9 shadow-xl border border-indigo-900/40">
        {/* Background glowing decorations */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Pill & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-blue-500/25 text-blue-300 border border-blue-400/30 flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>Équipe {equipe?.acronyme || equipe?.nom}</span>
              </span>

              {isUserChef ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30 flex items-center gap-1.5">
                  <span>👑</span>
                  <span>Vous dirigez cette équipe (Chef d'Équipe)</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <span>🔬</span>
                  <span>Votre équipe de rattachement</span>
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/messagerie?type=equipe"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 backdrop-blur-sm transition flex items-center gap-2"
                title="Accéder directement au canal d'équipe"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-300" />
                <span>Canal d'Équipe</span>
              </Link>

              <button
                onClick={() => setIsChangementEquipeModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 backdrop-blur-sm transition flex items-center gap-2"
                title="Demander un changement d'équipe ou un détachement"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-300" />
                <span>Changer d'équipe</span>
              </button>

              {isUserChef && (
                <>
                  <button
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 backdrop-blur-sm transition flex items-center gap-2"
                    title="Consulter l'historique des propositions de modification"
                  >
                    <History className="w-3.5 h-3.5 text-amber-300" />
                    <span>Historique ({demandesModif.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditNom(equipe?.nom || '');
                      setEditDescription(equipe?.description || '');
                      setEditThematiques(equipe?.thematiques || equipe?.axesRecherche || []);
                      setIsEditModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifier l'équipe</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Pending Modification Banner (if any) */}
          {pendingDemande && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 animate-spin" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Demande de modification en cours d'examen
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                      En attente Direction
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    Une proposition de modification (nouveau nom : « <strong className="text-white">{pendingDemande.nouveauNom}</strong> ») a été soumise le{' '}
                    {new Date(pendingDemande.dateDemande).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}. Les changements seront appliqués dès validation par la Direction.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-bold border border-amber-400/30 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <History className="w-3.5 h-3.5" />
                <span>Voir l'historique</span>
              </button>
            </div>
          )}

          {/* Team Title & Description */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{equipe?.nom}</span>
              {equipe?.acronyme && !equipe.nom.toUpperCase().includes(equipe.acronyme.toUpperCase()) && (
                <span className="text-lg font-semibold text-indigo-300">({equipe.acronyme})</span>
              )}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              {equipe?.description || 'Équipe de recherche scientifique rattachée au Laboratoire LIAS de la FSBM.'}
            </p>
          </div>

          {/* Thematics / Axes de recherche */}
          {thematiques.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Thématiques & Axes de Recherche :</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {thematiques.map((th, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium border border-white/10 backdrop-blur-xs transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>{th}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chef d'équipe spotlight banner if available */}
          {chef && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Avatar src={chef.photo} alt={`${chef.prenom} ${chef.nom}`} size="sm" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Chef d'Équipe actuel :</div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Dr. {chef.prenom} {chef.nom}</span>
                    {user?.id === chef.id && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                        C'est vous
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {user?.id !== chef.id && (
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${chef.email}`}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
                    title="Envoyer un e-mail"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                  <Link
                    to={`/messagerie?type=direct&id=${chef.id}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Discuter</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. STATISTIQUES DE PRODUCTION SCIENTIFIQUE DE L'ÉQUIPE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Production Scientifique de l'Équipe {equipe?.acronyme || equipe?.nom}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Indicateurs clés et historique des publications scientifiques rattachées à votre équipe.
            </p>
          </div>
          <Link
            to="/publications"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Bibliothèque globale</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Publications</span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {publications.length}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-1 block">
              Articles, conf. & ouvrages
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Production Récente</span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
              {pubsRecent}
            </div>
            <span className="text-[11px] font-medium text-emerald-700 mt-1 block">
              {pubsThisYear} en {currentYear} • {pubsRecent} sur 2 ans
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Membres Permanents</span>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-2">
              {permanents.length}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-1 block">
              Enseignants-chercheurs
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Doctorants Rattachés</span>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-600 mt-2">
              {doctorants.length}
            </div>
            <span className="text-[11px] font-medium text-purple-700 mt-1 block">
              Thèses en cours
            </span>
          </div>
        </div>

        {/* 2-Column Scientific Output Details: Histogram + Recent Team Publications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Yearly output histogram */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm">Évolution par Année</h4>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                {sortedYears.length} années
              </span>
            </div>

            {sortedYears.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Aucune donnée chronologique disponible.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {sortedYears.map((year) => {
                  const count = yearsMap[year] || 0;
                  const percentage = Math.round((count / maxPubsInAYear) * 100);

                  return (
                    <div key={year} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{year}</span>
                        <span className="font-semibold text-slate-500">
                          {count} {count > 1 ? 'publications' : 'publication'}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 12)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent publications list */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Dernières Publications de l'Équipe
              </h4>
              <Link
                to="/publications"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Tout explorer →
              </Link>
            </div>

            {publications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Aucune publication n'a encore été rattachée à cette équipe.
              </div>
            ) : (
              <div className="space-y-3">
                {publications.slice(0, 4).map((pub) => (
                  <div
                    key={pub.id}
                    className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/60 transition space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {pub.annee}
                        </span>
                        {pub.type && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-200 text-slate-700">
                            {pub.type.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      {pub.lienDoi && (
                        <a
                          href={pub.lienDoi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <span>DOI</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                      {pub.titre}
                    </h5>

                    {/* Authors with role tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 pt-1">
                      <span className="text-[11px] text-slate-400">Auteurs :</span>
                      {pub.auteurs && pub.auteurs.length > 0 ? (
                        pub.auteurs.map((aut, idx) => (
                          <span
                            key={aut.id || idx}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200"
                          >
                            <span>
                              {aut.prenom} {aut.nom}
                            </span>
                            {aut.statut === 'DOCTORANT' && (
                              <span className="text-[9px] text-purple-700 font-bold bg-purple-50 px-1 rounded">
                                Doc
                              </span>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs">Équipe {equipe?.nom}</span>
                      )}

                      {pub.coAuteursExternes && pub.coAuteursExternes.length > 0 && (
                        <span className="text-[11px] text-slate-500 italic">
                          + {pub.coAuteursExternes.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. LISTE DES MEMBRES PERMANENTS ET DOCTORANTS RATTACHÉS À L'ÉQUIPE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Membres & Doctorants de l'Équipe</span>
            </h3>
            <p className="text-xs text-slate-500">
              Liste complète des chercheurs permanents et doctorants affectés à l'équipe{' '}
              {equipe?.nom}.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({membres.length})
            </button>
            <button
              onClick={() => setActiveTab('permanents')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'permanents'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Permanents ({permanents.length})
            </button>
            <button
              onClick={() => setActiveTab('doctorants')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'doctorants'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doctorants ({doctorants.length})
            </button>
          </div>
        </div>

        {/* Members Roster Grid */}
        {displayedMembres.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Aucun membre trouvé dans cette catégorie.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedMembres.map((m) => {
              const isChef =
                chef?.id === m.id ||
                (m.roleLibelle || '').toLowerCase().includes('chef');

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                    isChef
                      ? 'bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200 shadow-xs'
                      : m.statut === 'DOCTORANT'
                      ? 'bg-purple-50/30 border-purple-100 hover:border-purple-200 hover:shadow-xs'
                      : 'bg-slate-50/50 border-slate-200/70 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar
                      src={m.photo}
                      alt={`${m.prenom} ${m.nom}`}
                      size="md"
                      rounded="rounded-2xl"
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {m.statut === 'PERMANENT' ? 'Dr. ' : ''}
                          {m.prenom} {m.nom}
                        </span>
                      </div>

                      <div>
                        <RoleBadge membre={m} />
                      </div>

                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 pt-0.5">
                        <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{m.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/80">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {m.statut === 'DOCTORANT' ? 'Doctorat LIAS' : 'Enseignant-Chercheur'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {user?.id === m.id ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                          Vous
                        </span>
                      ) : (
                        <Link
                          to={`/messagerie?type=direct&id=${m.id}`}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition flex items-center gap-1 hover:border-blue-300 hover:text-blue-600"
                          title={`Discuter avec ${m.prenom} ${m.nom}`}
                        >
                          <MessageSquare className="w-3 h-3 text-blue-600" />
                          <span>Message</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL: PROPOSER DES MODIFICATIONS DE L'ÉQUIPE (Chef d'équipe) */}
      {isUserChef && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Proposer des modifications - Équipe ${equipe?.nom}`}
        >
          <form onSubmit={handleSavePresentation} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Validation requise :</span> En tant que Chef d'Équipe, toute modification (nom, description, thématiques) sera soumise à la Direction du laboratoire. Les changements seront effectifs une fois validés par le Directeur.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom de l'équipe <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
                required
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                placeholder="Ex : Ingénierie Logicielle & Systèmes Intelligents"
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
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Décrivez les objectifs scientifiques et travaux de votre équipe..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thématiques et Domaines de Recherche
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newThematiqueInput}
                  onChange={(e) => setNewThematiqueInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddThematique();
                    }
                  }}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex : Apprentissage Profond, Systèmes Multi-Agents..."
                />
                <button
                  type="button"
                  onClick={handleAddThematique}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  Ajouter
                </button>
              </div>

              {/* Tags preview */}
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 min-h-[44px]">
                {editThematiques.length === 0 ? (
                  <span className="text-xs text-slate-400">Aucune thématique ajoutée.</span>
                ) : (
                  editThematiques.map((th, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200 flex items-center gap-1.5"
                    >
                      <span>{th}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveThematique(idx)}
                        className="text-blue-500 hover:text-blue-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {savingEdit ? 'Envoi en cours...' : 'Soumettre à la Direction'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. MODAL: HISTORIQUE DES DEMANDES DE MODIFICATION (Chef d'équipe) */}
      {isUserChef && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Historique des modifications - Équipe ${equipe?.nom}`}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <p className="text-xs text-slate-500">
              Consultez l'historique de toutes les demandes de modification soumises pour cette équipe ainsi que les décisions prises par la Direction.
            </p>

            {demandesModif.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                Aucune demande de modification n'a été enregistrée pour votre équipe.
              </div>
            ) : (
              <div className="space-y-3">
                {demandesModif.map((dem) => {
                  const isPending = dem.statut === 'EN_ATTENTE';
                  const isAccepted = dem.statut === 'ACCEPTEE' || (dem.statut as any) === 'APPROUVEE';
                  const isRefused = dem.statut === 'REFUSEE';

                  return (
                    <div
                      key={dem.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 shadow-xs space-y-3"
                    >
                      {/* Top Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>En attente de validation</span>
                            </span>
                          )}
                          {isAccepted && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Acceptée & Appliquée</span>
                            </span>
                          )}
                          {isRefused && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Refusée par la Direction</span>
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            Demande #{dem.id}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium">
                          Soumise le {new Date(dem.dateDemande).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {/* Content Diff */}
                      <div className="space-y-2 text-xs">
                        {/* Team Name */}
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 mb-0.5">Nom proposé :</div>
                          <div className="p-2 rounded-xl bg-slate-50 text-slate-800 font-semibold border border-slate-100 flex items-center justify-between">
                            <span>{dem.nouveauNom}</span>
                            {dem.ancienNom && dem.ancienNom !== dem.nouveauNom && (
                              <span className="text-[11px] text-slate-400 font-normal">
                                (Ancien : {dem.ancienNom})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {dem.nouvelleDescription && (
                          <div>
                            <div className="text-[11px] font-bold text-slate-500 mb-0.5">Description proposée :</div>
                            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 text-xs border border-slate-100 leading-relaxed whitespace-pre-wrap">
                              {dem.nouvelleDescription}
                            </div>
                          </div>
                        )}

                        {/* Thematiques / Tags */}
                        {dem.nouvellesThematiques && dem.nouvellesThematiques.length > 0 && (
                          <div>
                            <div className="text-[11px] font-bold text-slate-500 mb-1">Thématiques proposées :</div>
                            <div className="flex flex-wrap gap-1.5">
                              {dem.nouvellesThematiques.map((th, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100"
                                >
                                  {th}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Decision Details if decided */}
                      {isAccepted && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Validée et appliquée à l'équipe</span>
                          </div>
                          {dem.dateDecision && (
                            <span className="text-[11px] text-emerald-700 font-medium">
                              Le {new Date(dem.dateDecision).toLocaleDateString('fr-FR')} {dem.decideurNom ? `par ${dem.decideurNom}` : ''}
                            </span>
                          )}
                        </div>
                      )}

                      {isRefused && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span>Demande non retenue</span>
                            </div>
                            {dem.dateDecision && (
                              <span className="text-[11px] text-rose-600 font-medium">
                                Le {new Date(dem.dateDecision).toLocaleDateString('fr-FR')} {dem.decideurNom ? `par ${dem.decideurNom}` : ''}
                              </span>
                            )}
                          </div>
                          {dem.motifRefus ? (
                            <div className="text-xs bg-white/70 p-2.5 rounded-lg border border-rose-200 text-rose-900 leading-relaxed">
                              <strong className="font-semibold">Motif :</strong> {dem.motifRefus}
                            </div>
                          ) : (
                            <div className="text-[11px] text-rose-600 italic">
                              Aucun motif spécifié par la Direction.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Changement d'Équipe (Mobilité) */}
      <ModalChangementEquipe
        isOpen={isChangementEquipeModalOpen}
        onClose={() => setIsChangementEquipeModalOpen(false)}
        onSuccess={() => fetchEquipeAndDemandes()}
      />
    </div>
  );
};
