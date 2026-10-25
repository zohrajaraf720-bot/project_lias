import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Save,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Building2,
  Users,
  BookOpen,
  Handshake,
  Package,
  Layers,
  UserCheck,
  ExternalLink,
  GraduationCap,
  Clock,
  Eye,
  Edit3,
  Search,
  Mail,
  Phone,
  Globe,
  MapPin,
  Check,
  XCircle,
  Briefcase,
  ChevronRight,
  School,
  Share2,
} from 'lucide-react';
import api, { downloadFile } from '../../lib/api';
import { RapportActiviteDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useToast } from '../../lib/toastContext';

// =========================================================================
// HELPERS DE FORMATAGE HUMAIN (JAMAIS D'ENUM BRUT DE BASE DE DONNÉES)
// =========================================================================

export const formatReportStatus = (status: string) => {
  switch (status) {
    case 'BROUILLON':
      return {
        label: 'Brouillon en cours',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        dotClass: 'bg-amber-500',
      };
    case 'SOUMIS':
      return {
        label: 'Soumis pour examen',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        dotClass: 'bg-blue-500',
      };
    case 'VALIDE':
      return {
        label: 'Validé par la Direction',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        dotClass: 'bg-indigo-500',
      };
    case 'FINALISE':
      return {
        label: 'Rapport Officiel Finalisé & Signé',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotClass: 'bg-emerald-500',
      };
    default:
      return {
        label: status || 'État initial',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
        dotClass: 'bg-slate-400',
      };
  }
};

export const formatMemberStatus = (code?: string, fallback?: string) => {
  if (fallback && fallback !== code && !fallback.includes('_')) return fallback;
  switch (code) {
    case 'PERMANENT':
      return 'Enseignant-Chercheur Permanent';
    case 'DOCTORANT':
      return 'Doctorant-Chercheur';
    case 'ASSOCIE':
      return 'Chercheur Associé';
    default:
      return fallback || code || 'Membre du Laboratoire';
  }
};

export const formatMemberRole = (role?: string) => {
  if (!role) return 'Membre de l’Équipe';
  if (role.toLowerCase().includes('chef')) return "Chef d'Équipe";
  if (role.toLowerCase().includes('doctorant')) return 'Doctorant-Chercheur';
  if (role.toLowerCase().includes('titulaire') || role.toLowerCase().includes('permanent')) return 'Membre Titulaire';
  if (role.toLowerCase().includes('associé')) return 'Chercheur Associé';
  return role;
};

export const formatPublicationType = (code?: string, fallback?: string) => {
  if (fallback && fallback !== code && !fallback.includes('_')) return fallback;
  switch (code) {
    case 'ARTICLE_JOURNAL':
      return 'Article de Revue Internationale';
    case 'CONFERENCE_INTERNATIONALE':
      return 'Conférence Internationale avec Actes';
    case 'CONFERENCE_NATIONALE':
      return 'Conférence Nationale';
    case 'CHAPITRE_LIVRE':
      return "Chapitre d'Ouvrage";
    case 'LIVRE':
      return 'Ouvrage Scientifique';
    case 'BREVET':
      return 'Brevet / Propriété Intellectuelle';
    case 'THESE':
      return 'Thèse de Doctorat';
    case 'AUTRE':
      return 'Autre Contribution Scientifique';
    default:
      return fallback || code || 'Publication Scientifique';
  }
};

export const formatEventType = (code?: string, fallback?: string) => {
  if (fallback && fallback !== code && !fallback.includes('_')) return fallback;
  switch (code) {
    case 'CONFERENCE':
      return 'Conférence Internationale';
    case 'SEMINAIRE':
      return 'Séminaire de Recherche';
    case 'WORKSHOP':
    case 'ATELIER':
      return 'Atelier / Workshop Scientifique';
    case 'SOUTENANCE_THESE':
      return 'Soutenance de Thèse';
    case 'JOURNEE_ETUDE':
      return "Journée d'Étude";
    case 'TABLE_RONDE':
      return 'Table Ronde Scientifique';
    case 'AUTRE':
      return 'Manifestation Scientifique';
    default:
      return fallback || code || 'Événement Scientifique';
  }
};

export const formatEventStatus = (code?: string, fallback?: string) => {
  if (fallback && fallback !== code && !fallback.includes('_')) return fallback;
  switch (code) {
    case 'EN_PREPARATION':
      return 'En cours de préparation';
    case 'PLANIFIE':
      return 'Planifié / Programmé';
    case 'EN_COURS':
      return 'En cours de déroulement';
    case 'TERMINE':
      return 'Clôturé avec succès';
    case 'ARCHIVE':
      return 'Archivé';
    case 'ANNULE':
      return 'Annulé';
    default:
      return fallback || code || 'Statut Inconnu';
  }
};

export const formatEventValidation = (code?: string, fallback?: string) => {
  if (fallback && fallback !== code && !fallback.includes('_')) return fallback;
  switch (code) {
    case 'VALIDE':
      return 'Validé par la Direction';
    case 'EN_ATTENTE_VALIDATION':
    case 'EN_ATTENTE':
      return "En attente d'approbation";
    case 'REJETE':
      return 'Refusé par la Direction';
    default:
      return fallback || code || 'Non validé';
  }
};

export const formatConventionStatus = (code?: string, fallback?: string) => {
  if (fallback && fallback !== code && !fallback.includes('_')) return fallback;
  switch (code) {
    case 'EN_COURS':
    case 'ACTIVE':
      return 'En vigueur / Active';
    case 'EN_NEGOCIATION':
      return 'En phase de négociation';
    case 'TERMINEE':
    case 'EXPIREE':
      return 'Clôturée / Expirée';
    case 'SUSPENDUE':
    case 'RESILIEE':
      return 'Suspendue ou résiliée';
    default:
      return fallback || code || 'En cours';
  }
};

export const formatInstitutionType = (code?: string, fallback?: string) => {
  if (fallback && fallback !== code && !fallback.includes('_')) return fallback;
  switch (code) {
    case 'UNIVERSITE':
      return 'Université / Établissement Académique';
    case 'ENTREPRISE':
      return 'Entreprise / Secteur Industriel';
    case 'CENTRE_RECHERCHE':
      return 'Centre ou Institut de Recherche';
    case 'ORGANISME_PUBLIC':
      return 'Organisme Public';
    default:
      return fallback || code || 'Partenaire Institutionnel';
  }
};

export const formatDateFR = (dateStr?: string) => {
  if (!dateStr) return 'Date non renseignée';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// =========================================================================
// COMPOSANT PRINCIPAL : RAPPORT ANNUEL
// =========================================================================

export const RapportAnnuel: React.FC = () => {
  const { success, error } = useToast();

  const currentYear = new Date().getFullYear();
  const [annee, setAnnee] = useState<number>(currentYear);
  const [rapport, setRapport] = useState<RapportActiviteDTO | null>(null);
  const [contenuMarkdown, setContenuMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'apercu' | 'equipes' | 'publications' | 'evenements' | 'partenariats' | 'rh' | 'markdown'
  >('apercu');

  // Search filters
  const [equipeSearch, setEquipeSearch] = useState('');
  const [pubSearch, setPubSearch] = useState('');
  const [pubTypeFilter, setPubTypeFilter] = useState('ALL');
  const [evenementSearch, setEvenementSearch] = useState('');
  const [rhSearch, setRhSearch] = useState('');
  const [rhStatusFilter, setRhStatusFilter] = useState('ALL');

  const fetchRapport = async (year: number) => {
    setLoading(true);
    try {
      const res = await api.get<RapportActiviteDTO>(`/rapports/${year}`);
      setRapport(res.data);
      setContenuMarkdown(res.data?.contenuMarkdown || '');
    } catch {
      setRapport(null);
      setContenuMarkdown('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRapport(annee);
  }, [annee]);

  // Extraction des données exhaustives du Snapshot JSON
  const details = useMemo(() => {
    if (!rapport?.donneesBrutes) return null;
    try {
      return JSON.parse(rapport.donneesBrutes);
    } catch {
      return null;
    }
  }, [rapport?.donneesBrutes]);

  const stats = details?.statistiques || {};
  const labo = details?.laboratoire || {};
  const equipes: any[] = details?.equipes || [];
  const publications: any[] = details?.publications || [];
  const evenements: any[] = details?.evenements || [];
  const conventions: any[] = details?.conventions || [];
  const membres: any[] = details?.membres || [];

  // Régénération et actualisation intégrale
  const handleGenererOuRegenerer = async () => {
    setSaving(true);
    try {
      const res = await api.post<RapportActiviteDTO>(`/rapports/generer/${annee}`);
      setRapport(res.data);
      setContenuMarkdown(res.data.contenuMarkdown || '');
      success(`Le rapport d'activité annuel ${annee} a été régénéré et actualisé avec succès !`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la génération du rapport.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnregistrerMarkdown = async () => {
    if (!rapport) return;
    setSaving(true);
    try {
      const res = await api.put<RapportActiviteDTO>(`/rapports/${rapport.id}`, {
        contenuMarkdown,
      });
      setRapport(res.data);
      success('Modifications textuelles du rapport enregistrées.');
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinaliserPdf = async () => {
    if (!rapport) return;
    setGeneratingPdf(true);
    try {
      const res = await api.post<RapportActiviteDTO>(`/rapports/${rapport.id}/finaliser`);
      setRapport(res.data);
      success('Le rapport annuel a été finalisé et compilé au format PDF iText officiel !');
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la compilation du PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleTelechargerPdf = async () => {
    if (!rapport) return;
    try {
      await downloadFile(`/rapports/${rapport.id}/pdf`, `Rapport_Annuel_LIAS_${rapport.annee}.pdf`);
      success('Téléchargement du rapport PDF officiel en cours.');
    } catch (err: any) {
      error(err.response?.data?.message || "Le PDF n'est pas encore disponible.");
    }
  };

  const years = Array.from({ length: 8 }, (_, i) => currentYear - i);

  // Filtrages
  const filteredEquipes = useMemo(() => {
    if (!equipeSearch.trim()) return equipes;
    const q = equipeSearch.toLowerCase();
    return equipes.filter(
      (eq) =>
        eq.nom?.toLowerCase().includes(q) ||
        eq.acronyme?.toLowerCase().includes(q) ||
        eq.chefNom?.toLowerCase().includes(q) ||
        eq.membres?.some((m: any) => m.nomComplet?.toLowerCase().includes(q))
    );
  }, [equipes, equipeSearch]);

  const filteredPublications = useMemo(() => {
    return publications.filter((p) => {
      const matchesSearch =
        !pubSearch.trim() ||
        p.titre?.toLowerCase().includes(pubSearch.toLowerCase()) ||
        p.equipeNom?.toLowerCase().includes(pubSearch.toLowerCase()) ||
        p.auteurs?.some((a: string) => a.toLowerCase().includes(pubSearch.toLowerCase()));

      const matchesType = pubTypeFilter === 'ALL' || p.typeCode === pubTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [publications, pubSearch, pubTypeFilter]);

  const filteredEvenements = useMemo(() => {
    if (!evenementSearch.trim()) return evenements;
    const q = evenementSearch.toLowerCase();
    return evenements.filter(
      (ev) =>
        ev.titre?.toLowerCase().includes(q) ||
        ev.lieu?.toLowerCase().includes(q) ||
        ev.typeLibelle?.toLowerCase().includes(q)
    );
  }, [evenements, evenementSearch]);

  const filteredMembres = useMemo(() => {
    return membres.filter((m) => {
      const matchesSearch =
        !rhSearch.trim() ||
        m.nomComplet?.toLowerCase().includes(rhSearch.toLowerCase()) ||
        m.email?.toLowerCase().includes(rhSearch.toLowerCase()) ||
        m.equipeNom?.toLowerCase().includes(rhSearch.toLowerCase());

      const matchesStatus = rhStatusFilter === 'ALL' || m.statutCode === rhStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [membres, rhSearch, rhStatusFilter]);

  const reportStatusInfo = formatReportStatus(rapport?.statut || 'BROUILLON');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* =========================================================================
          EN-TÊTE DE LA PAGE AVEC SÉLECTEUR D'ANNÉE ET ACTIONS PRINCIPALES
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Gouvernance & Bilan d'Activité Officiel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Rapport d'Activité Annuel du Laboratoire
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Édition institutionnelle, gouvernance de recherche, inventaires et compilation iText 7.
          </p>
        </div>

        {/* Sélecteur d'exercice annuel */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-2xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-500">Exercice :</span>
            <select
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
              className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  Année {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTENU SELON CHARGEMENT / EXISTENCE DU RAPPORT
      ========================================================================= */}
      {loading ? (
        <LoadingSpinner text={`Chargement du rapport d'activité pour l'exercice ${annee}...`} />
      ) : !rapport ? (
        /* État vide : invitation à générer le rapport */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-6 shadow-xs max-w-3xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-10 h-10" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl font-black text-slate-900">
              Aucun rapport généré pour l'exercice {annee}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Le système va agréger exhaustivement toutes les données réelles du laboratoire pour l'année {annee} :
              fiche d'identité du laboratoire, équipes et liste nominative des membres avec date d'affiliation et rôle,
              publications indexées avec DOI, manifestations scientifiques, conventions et ressources humaines.
            </p>
          </div>
          <button
            onClick={handleGenererOuRegenerer}
            disabled={saving}
            className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition inline-flex items-center gap-2.5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{saving ? 'Génération en cours...' : `Générer le rapport annuel ${annee}`}</span>
          </button>
        </div>
      ) : (
        /* Rapport existant : tableau de bord complet */
        <div className="space-y-6">
          {/* =========================================================================
              BANNER HERO : VUE D'ENSEMBLE, ÉTAT & ACTIONS CRITIQUES
          ========================================================================= */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl border border-white/10 p-6 sm:p-8">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                {/* Badges d'état et d'exercice */}
                <div className="flex items-center gap-2.5 flex-wrap text-xs">
                  <span className="px-3 py-1 rounded-full font-black tracking-wide uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Exercice Annuel {rapport.annee}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border ${reportStatusInfo.badgeClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${reportStatusInfo.dotClass}`} />
                    <span>{reportStatusInfo.label}</span>
                  </span>

                  <span className="text-xs text-blue-200/80 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      Généré le{' '}
                      {rapport.dateGeneration
                        ? new Date(rapport.dateGeneration).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Date non définie'}
                    </span>
                  </span>
                </div>

                {/* Logo officiel & Nom du Laboratoire */}
                <div className="flex items-start gap-4">
                  <img
                    src="/logo-white.png"
                    alt="Logo LIAS"
                    className="h-16 w-auto object-contain rounded-2xl bg-white/10 p-2 border border-white/20 shadow-md shrink-0 hidden sm:block"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {(labo.nom ? labo.nom.replace(/\s*\(LIAS\)/gi, "") : "Laboratoire d'Intelligence Artificielle et Systèmes")}{' '}
                      <span className="text-blue-400 font-mono text-xl sm:text-2xl">
                        ({labo.acronyme || 'LIAS'})
                      </span>
                    </h2>
                    <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-2xl leading-relaxed">
                      {labo.etablissement || "Faculté des Sciences Ben M'Sik"} • {labo.universite || 'Université Hassan II de Casablanca'}
                    </p>
                    <p className="text-xs text-slate-300/80 mt-1 flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        Directeur du Laboratoire :{' '}
                        <strong className="text-white font-semibold">
                          {labo.directeurNom || labo.directeur || 'Direction du Laboratoire'}
                        </strong>{' '}
                        ({labo.directeurEmail || labo.email || 'direction.lias@univh2c.ma'})
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions d'état : Régénérer, Finaliser, Télécharger */}
              <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap shrink-0">
                <button
                  onClick={handleGenererOuRegenerer}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2 shadow-xs backdrop-blur-xs disabled:opacity-50 cursor-pointer"
                  title="Régénérer et actualiser le rapport avec toutes les données réelles du laboratoire"
                >
                  <RotateCcw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Régénération...' : 'Régénérer le Rapport'}</span>
                </button>

                {rapport.statut !== 'FINALISE' && (
                  <button
                    onClick={handleFinaliserPdf}
                    disabled={generatingPdf}
                    className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>{generatingPdf ? 'Compilation iText 7...' : 'Finaliser & Valider'}</span>
                  </button>
                )}

                {rapport.cheminFichierPdf && (
                  <button
                    onClick={handleTelechargerPdf}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger le PDF</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================================
              GRILLE DES KPI EXÉCUTIFS (STATISTIQUES DE L'ANNÉE)
          ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Membres */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-sm transition">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Membres Actifs</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{stats.totalMembres ?? 0}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {stats.totalPermanents ?? 0} perm. • {stats.totalDoctorants ?? 0} doct.
              </div>
            </div>

            {/* Équipes */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-sm transition">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Équipes</span>
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{stats.totalEquipes ?? 0}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Axes de recherche</div>
            </div>

            {/* Publications */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-sm transition">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Publications</span>
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{stats.totalPublications ?? 0}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Indexées en {annee}</div>
            </div>

            {/* Événements */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-sm transition">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Événements</span>
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{stats.totalEvenements ?? 0}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Colloques & séminaires</div>
            </div>

            {/* Conventions */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-sm transition">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Conventions</span>
                <Handshake className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{stats.totalConventions ?? 0}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Accords en vigueur</div>
            </div>

            {/* Matériels & Réunions */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-sm transition">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Équipements</span>
                <Package className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{stats.totalMateriels ?? 0}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {stats.totalNouveauxMateriels ?? 0} acquis en {annee}
              </div>
            </div>
          </div>

          {/* =========================================================================
              BARRE D'ONGLETS DE NAVIGATION MULTI-SECTIONS
          ========================================================================= */}
          <div className="flex items-center gap-1.5 border-b border-slate-200/90 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('apercu')}
              className={`pb-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'apercu'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Fiche Labo & Synthèse</span>
            </button>

            <button
              onClick={() => setActiveTab('equipes')}
              className={`pb-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'equipes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Équipes & Membres Détaillés ({equipes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('publications')}
              className={`pb-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'publications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Publications Scientifiques ({publications.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('evenements')}
              className={`pb-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'evenements'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Événements Scientifiques ({evenements.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('partenariats')}
              className={`pb-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'partenariats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Handshake className="w-4 h-4 text-teal-600" />
              <span>Conventions & Partenariats ({conventions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('rh')}
              className={`pb-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'rh'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Effectifs & Membres ({membres.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('markdown')}
              className={`pb-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'markdown'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Synthèse Markdown & Édition</span>
            </button>
          </div>

          {/* =========================================================================
              ONGLET 1 : FICHE INSTITUTIONNELLE DU LABO & SYNTHÈSE GÉNÉRALE
          ========================================================================= */}
          {activeTab === 'apercu' && (
            <div className="space-y-6">
              {/* Carte Fiche d'Identité Détaillée */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/logo.png"
                      alt="Logo LIAS"
                      className="w-12 h-12 rounded-2xl object-contain bg-slate-50 border border-slate-200/80 p-1 shadow-inner shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                        Fiche d'Identité Officielle
                      </span>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">
                        {labo.nom || "Laboratoire d'Intelligence Artificielle et Systèmes"} ({labo.acronyme || 'LIAS'})
                      </h3>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                    Créé le {formatDateFR(labo.dateCreation)}
                  </span>
                </div>

                {/* Données d'implantation & coordonnées */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      Établissement & Université
                    </span>
                    <p className="text-xs font-bold text-slate-900">{labo.etablissement}</p>
                    <p className="text-[11px] text-slate-500">{labo.universite}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      Adresse Physique
                    </span>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {labo.adresse || "Avenue Cdt Driss El Harti, B.P 7955 Sidi Othmane, Casablanca, Maroc"}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-purple-600" />
                      Contacts Officiels
                    </span>
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {labo.email || 'contact.lias@univh2c.ma'}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {labo.telephone || '+212 (0) 522 70 46 71'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      Portail Web Officiel
                    </span>
                    <a
                      href={labo.siteWeb || 'https://lias.fsbm.univh2c.ma'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 truncate block underline flex items-center gap-1"
                    >
                      <span>{labo.siteWeb || 'lias.fsbm.univh2c.ma'}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                {/* Direction et Gouvernance du Laboratoire */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-slate-50 border border-blue-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                        Direction du Laboratoire (Mandat en Exercice)
                      </span>
                      <h4 className="text-sm font-black text-slate-900">
                        {labo.directeurNom || labo.directeur || 'Direction du Laboratoire'}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {labo.directeurEmail || labo.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-blue-100 shadow-2xs">
                    <span>Prise de fonction : </span>
                    <strong className="text-slate-900">{formatDateFR(labo.directeurDateDebut)}</strong>
                  </div>
                </div>

                {/* Description scientifique & missions */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Missions & Champ d'Action Scientifique
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                    {labo.description ||
                      "Pôle d'excellence en recherche scientifique pluridisciplinaire, ingénierie logicielle, intelligence artificielle, traitement du signal et modélisation des systèmes complexes."}
                  </p>
                </div>
              </div>

              {/* Aperçu des équipes avec bouton pour aller à l'onglet détaillé */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Structures de Recherche & Équipes Rattachées ({equipes.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('equipes')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Voir la composition nominative détaillée</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {equipes.map((eq: any) => (
                    <div
                      key={eq.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-lg">
                          {eq.acronyme}
                        </span>
                        <span className="text-xs text-slate-600 font-bold flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          {eq.nombreMembres} membres
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{eq.nom}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="truncate">Chef : {eq.chefNom}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aperçu rapide des dernières publications et événements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dernières publications */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>Dernières Publications Scientifiques ({publications.length})</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('publications')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Voir tout
                    </button>
                  </div>

                  {publications.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      Aucune publication indexée pour l'exercice {annee}.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {publications.slice(0, 4).map((p: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block line-clamp-1">{p.titre}</span>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {p.auteurs?.join(', ')}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                            {formatPublicationType(p.typeCode, p.typeLibelle)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Derniers événements */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>Événements & Séminaires ({evenements.length})</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('evenements')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Voir tout
                    </button>
                  </div>

                  {evenements.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      Aucun événement recensé pour l'exercice {annee}.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {evenements.slice(0, 4).map((ev: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block line-clamp-1">{ev.titre}</span>
                            <p className="text-[11px] text-slate-500">
                              {ev.lieu || 'FSBM Casablanca'} • {formatDateFR(ev.dateDebut)}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shrink-0">
                            {formatEventType(ev.typeCode, ev.typeLibelle)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ONGLET 2 : ÉQUIPES DE RECHERCHE & LISTE NOMINATIVE DES MEMBRES DÉTAILLÉE
          ========================================================================= */}
          {activeTab === 'equipes' && (
            <div className="space-y-6">
              {/* Barre de recherche dans les équipes */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={equipeSearch}
                    onChange={(e) => setEquipeSearch(e.target.value)}
                    placeholder="Rechercher une équipe par nom, acronyme, chef d'équipe ou membre..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="text-xs text-slate-500 font-bold whitespace-nowrap">
                  {filteredEquipes.length} équipe(s) trouvée(s)
                </div>
              </div>

              {filteredEquipes.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
                  <Layers className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Aucune équipe ne correspond à votre recherche</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredEquipes.map((eq: any) => (
                    <div
                      key={eq.id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5"
                    >
                      {/* En-tête de l'équipe */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-black text-blue-700 bg-blue-100/70 border border-blue-200 px-3 py-1 rounded-xl">
                              {eq.acronyme}
                            </span>
                            <h3 className="text-lg font-black text-slate-900">{eq.nom}</h3>
                          </div>
                          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                            {eq.description || 'Structure de recherche opérationnelle au sein du laboratoire LIAS.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span>{eq.nombreMembres || (eq.membres?.length || 0)} Membres Rattachés</span>
                          </span>
                        </div>
                      </div>

                      {/* Thématiques et Chef d'équipe */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Chef d'équipe Card */}
                        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/70 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                            <UserCheck className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5 text-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                              Chef d'Équipe en Mandat
                            </span>
                            <div className="font-black text-slate-900">{eq.chefNom}</div>
                            {eq.chefEmail && (
                              <div className="text-[11px] text-slate-500">{eq.chefEmail}</div>
                            )}
                            {eq.chefDateDebut && (
                              <div className="text-[10px] text-purple-800 pt-0.5">
                                Nommé le {formatDateFR(eq.chefDateDebut)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Thématiques Card */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Thématiques & Axes de Recherche de l'Équipe
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(eq.thematiques || []).length === 0 ? (
                              <span className="text-xs text-slate-400 italic">
                                Aucune thématique spécifique renseignée
                              </span>
                            ) : (
                              eq.thematiques.map((th: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-[11px] bg-white text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-lg font-medium shadow-2xs"
                                >
                                  {th}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* TABLEAU NOMINATIF DES MEMBRES DE L'ÉQUIPE */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span>Composition Nominative Complète de l'Équipe</span>
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {eq.membres?.length || 0} chercheur(s)
                          </span>
                        </div>

                        {(eq.membres || []).length === 0 ? (
                          <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-400 italic">
                            Aucun membre n'est actuellement rattaché à cette équipe.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="py-3 px-4">Membre & Coordonnées</th>
                                  <th className="py-3 px-4">Rôle dans l'Équipe</th>
                                  <th className="py-3 px-4">Statut Académique</th>
                                  <th className="py-3 px-4">Date de Rattachement</th>
                                  <th className="py-3 px-4">Établissement</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {eq.membres.map((m: any, mIdx: number) => {
                                  const isChef =
                                    m.roleEquipe?.toLowerCase().includes('chef') ||
                                    m.nomComplet === eq.chefNom;

                                  return (
                                    <tr
                                      key={mIdx}
                                      className={`hover:bg-slate-50/70 transition ${
                                        isChef ? 'bg-purple-50/30 font-medium' : ''
                                      }`}
                                    >
                                      {/* Nom & Email */}
                                      <td className="py-3 px-4">
                                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                          <span>{m.nomComplet}</span>
                                          {isChef && (
                                            <span className="text-[9px] font-black uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                              Chef
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-slate-500">{m.email}</div>
                                      </td>

                                      {/* Rôle */}
                                      <td className="py-3 px-4">
                                        <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                                            isChef
                                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                              : m.statutCode === 'DOCTORANT'
                                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                                          }`}
                                        >
                                          {formatMemberRole(m.roleEquipe)}
                                        </span>
                                      </td>

                                      {/* Statut Académique */}
                                      <td className="py-3 px-4">
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                            m.statutCode === 'PERMANENT'
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                              : m.statutCode === 'DOCTORANT'
                                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                                          }`}
                                        >
                                          {formatMemberStatus(m.statutCode, m.statutLibelle)}
                                        </span>
                                      </td>

                                      {/* Date d'Affiliation */}
                                      <td className="py-3 px-4">
                                        <span className="text-slate-700 font-semibold flex items-center gap-1">
                                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                          <span>
                                            {m.dateAffiliationFormatee ||
                                              (m.dateAffiliation
                                                ? formatDateFR(m.dateAffiliation)
                                                : 'Depuis la fondation')}
                                          </span>
                                        </span>
                                      </td>

                                      {/* Établissement d'Origine */}
                                      <td className="py-3 px-4 text-slate-600">
                                        {m.etablissementOrigine || labo.etablissement || "FSBM Casablanca"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              ONGLET 3 : PUBLICATIONS SCIENTIFIQUES DE L'ANNÉE
          ========================================================================= */}
          {activeTab === 'publications' && (
            <div className="space-y-6">
              {/* Barre de recherche et filtres de types */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pubSearch}
                    onChange={(e) => setPubSearch(e.target.value)}
                    placeholder="Rechercher par titre, auteur, équipe de rattachement ou DOI..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={pubTypeFilter}
                    onChange={(e) => setPubTypeFilter(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none"
                  >
                    <option value="ALL">Tous les types de publication</option>
                    <option value="ARTICLE_JOURNAL">Article de Revue Internationale</option>
                    <option value="CONFERENCE_INTERNATIONALE">Conférence Internationale avec Actes</option>
                    <option value="CONFERENCE_NATIONALE">Conférence Nationale</option>
                    <option value="CHAPITRE_LIVRE">Chapitre d'Ouvrage</option>
                    <option value="LIVRE">Ouvrage Scientifique</option>
                    <option value="BREVET">Brevet</option>
                    <option value="THESE">Thèse de Doctorat</option>
                  </select>
                </div>
              </div>

              {filteredPublications.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Aucune publication trouvée pour cette sélection</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPublications.map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3 hover:border-slate-300 transition"
                    >
                      {/* En-tête publication */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                          {formatPublicationType(p.typeCode, p.typeLibelle)}
                        </span>

                        {p.equipeNom && (
                          <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{p.equipeNom}</span>
                          </span>
                        )}
                      </div>

                      {/* Titre */}
                      <h4 className="font-black text-slate-900 text-base leading-snug">{p.titre}</h4>

                      {/* Auteurs */}
                      {p.auteurs && p.auteurs.length > 0 && (
                        <div className="text-xs text-slate-600 flex items-start gap-1.5">
                          <strong className="text-slate-800 shrink-0">Auteurs : </strong>
                          <span className="leading-relaxed">{p.auteurs.join(', ')}</span>
                        </div>
                      )}

                      {/* Résumé */}
                      {p.resume && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                          « {p.resume} »
                        </p>
                      )}

                      {/* DOI & Liens */}
                      {p.doi && (
                        <div className="pt-1">
                          <a
                            href={p.doi.startsWith('http') ? p.doi : `https://doi.org/${p.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-3 py-1 rounded-lg border border-blue-200/70"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Identifiant Numérique d'Objet (DOI) : {p.doi}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              ONGLET 4 : ÉVÉNEMENTS SCIENTIFIQUES & COLLOQUES DE L'ANNÉE
          ========================================================================= */}
          {activeTab === 'evenements' && (
            <div className="space-y-6">
              {/* Barre de recherche */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={evenementSearch}
                    onChange={(e) => setEvenementSearch(e.target.value)}
                    placeholder="Rechercher par titre de manifestation, lieu ou type d'événement..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="text-xs text-slate-500 font-bold whitespace-nowrap">
                  {filteredEvenements.length} événement(s)
                </div>
              </div>

              {filteredEvenements.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
                  <Calendar className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Aucun événement scientifique trouvé pour l'exercice {annee}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvenements.map((ev: any, idx: number) => {
                    const isTermine = ev.statutCode === 'TERMINE';
                    const isValidated = ev.statutValidationCode === 'VALIDE';

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3.5 hover:border-slate-300 transition"
                      >
                        {/* En-tête événement */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                              {formatEventType(ev.typeCode, ev.typeLibelle)}
                            </span>

                            {/* Statut d'avancement humanisé */}
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                                isTermine
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}
                            >
                              {formatEventStatus(ev.statutCode, ev.statutLibelle)}
                            </span>

                            {/* Statut de validation direction */}
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                                isValidated
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : ev.statutValidationCode === 'REJETE'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isValidated ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : ev.statutValidationCode === 'REJETE' ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {formatEventValidation(ev.statutValidationCode, ev.statutValidationLibelle)}
                              </span>
                            </span>
                          </div>

                          {/* Date */}
                          {ev.dateDebut && (
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {formatDateFR(ev.dateDebut)}
                                {ev.dateFin && ev.dateFin !== ev.dateDebut ? ` au ${formatDateFR(ev.dateFin)}` : ''}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Titre */}
                        <h4 className="font-black text-slate-900 text-base">{ev.titre}</h4>

                        {/* Lieu & Détails */}
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" />
                          <span>Lieu de déroulement : </span>
                          <strong className="text-slate-800">{ev.lieu || 'FSBM Casablanca'}</strong>
                        </div>

                        {/* Description */}
                        {ev.description && (
                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              ONGLET 5 : CONVENTIONS & PARTENARIATS INTERNATIONAUX
          ========================================================================= */}
          {activeTab === 'partenariats' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-teal-600" />
                    <span>Conventions & Partenariats Bilatéraux Actifs ({conventions.length})</span>
                  </h3>
                </div>

                {conventions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <Handshake className="w-12 h-12 mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">
                      Aucune convention bilatérale active pour l'exercice {annee}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conventions.map((c: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-xl">
                            {formatInstitutionType(c.typeInstitutionCode, c.typeInstitutionLibelle)}
                          </span>

                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                            {formatConventionStatus(c.statutCode, c.statutLibelle)}
                          </span>
                        </div>

                        <h4 className="font-black text-slate-900 text-sm">{c.titre}</h4>

                        <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                          <span>
                            Partenaire officiel : <strong className="text-slate-800">{c.partenaireNom}</strong>
                          </span>
                          <span>•</span>
                          <span>Pays : <strong className="text-slate-800">{c.partenairePays || 'Maroc'}</strong></span>
                        </div>

                        {(c.dateSignature || c.dateExpiration) && (
                          <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Signée le {formatDateFR(c.dateSignature)}
                              {c.dateExpiration ? ` — Expire le ${formatDateFR(c.dateExpiration)}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              ONGLET 6 : RESSOURCES HUMAINES & EFFECTIFS GLOBAUX
          ========================================================================= */}
          {activeTab === 'rh' && (
            <div className="space-y-6">
              {/* Barre de recherche et filtrage par statut */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={rhSearch}
                    onChange={(e) => setRhSearch(e.target.value)}
                    placeholder="Rechercher un chercheur par nom, prénom, email ou équipe..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={rhStatusFilter}
                    onChange={(e) => setRhStatusFilter(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none"
                  >
                    <option value="ALL">Tous les statuts de membre</option>
                    <option value="PERMANENT">Enseignants-Chercheurs Permanents</option>
                    <option value="DOCTORANT">Doctorants-Chercheurs</option>
                    <option value="ASSOCIE">Chercheurs Associés</option>
                  </select>
                </div>
              </div>

              {filteredMembres.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Aucun chercheur trouvé pour cette sélection</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMembres.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-slate-900 text-sm">{m.nomComplet}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            m.statutCode === 'PERMANENT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.statutCode === 'DOCTORANT'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {formatMemberStatus(m.statutCode, m.statutLibelle)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{m.email}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[11px] text-slate-400">Équipe :</span>
                          <strong className="text-slate-800">{m.equipeNom}</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[11px] text-slate-400">Affiliation :</span>
                          <span className="text-slate-700">{m.dateAffiliation || 'Non renseignée'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              ONGLET 7 : SYNTHÈSE TEXTUELLE MARKDOWN & ÉDITION AVANCÉE
          ========================================================================= */}
          {activeTab === 'markdown' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-3">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-indigo-600" />
                    <span>Synthèse Textuelle & Édition Markdown du Rapport</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ce texte synthétique est automatiquement rédigé lors de la génération et peut être personnalisé avant compilation PDF.
                  </p>
                </div>

                {rapport.statut !== 'FINALISE' && (
                  <button
                    onClick={handleEnregistrerMarkdown}
                    disabled={saving}
                    className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                  </button>
                )}
              </div>

              <textarea
                rows={20}
                value={contenuMarkdown}
                onChange={(e) => setContenuMarkdown(e.target.value)}
                disabled={rapport.statut === 'FINALISE'}
                placeholder="Contenu synthétique en Markdown du rapport d'activité annuel..."
                className="w-full p-5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed disabled:opacity-80"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default RapportAnnuel;
