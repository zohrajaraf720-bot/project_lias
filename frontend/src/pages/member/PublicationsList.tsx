import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { PublicationDTO, EquipeDTO, MembreResumeDTO, PageDTO, TypePublication } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { Pagination } from '../../components/Pagination';
import { useToast } from '../../lib/toastContext';

export const PUBLICATION_TYPES: { value: TypePublication; label: string }[] = [
  { value: 'ARTICLE_JOURNAL', label: 'Article de Revue / Journal' },
  { value: 'CONFERENCE_INTERNATIONALE', label: 'Conférence Internationale' },
  { value: 'CONFERENCE_NATIONALE', label: 'Conférence Nationale' },
  { value: 'CHAPITRE_LIVRE', label: 'Chapitre d\'ouvrage' },
  { value: 'LIVRE', label: 'Livre / Monographie' },
  { value: 'BREVET', label: 'Brevet' },
  { value: 'THESE', label: 'Thèse de Doctorat' },
  { value: 'AUTRE', label: 'Autre' },
];

export const getPublicationTypeLabel = (type?: TypePublication) => {
  switch (type) {
    case 'ARTICLE_JOURNAL':
      return 'Article de Journal';
    case 'CONFERENCE_INTERNATIONALE':
      return 'Conférence Internationale';
    case 'CONFERENCE_NATIONALE':
      return 'Conférence Nationale';
    case 'CHAPITRE_LIVRE':
      return 'Chapitre d\'ouvrage';
    case 'LIVRE':
      return 'Livre / Monographie';
    case 'BREVET':
      return 'Brevet';
    case 'THESE':
      return 'Thèse de Doctorat';
    case 'AUTRE':
      return 'Autre';
    default:
      return 'Publication';
  }
};

export const PublicationsList: React.FC = () => {
  const { user, isAdmin, canPublish } = useAuth();
  const { success, error } = useToast();

  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [membres, setMembres] = useState<MembreResumeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterEquipeId, setFilterEquipeId] = useState('');
  const [filterAuteurId, setFilterAuteurId] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [typePub, setTypePub] = useState<TypePublication>('ARTICLE_JOURNAL');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [resume, setResume] = useState('');
  const [lienDoi, setLienDoi] = useState('');
  const [equipeId, setEquipeId] = useState<string>(user?.equipeId?.toString() || '');
  const [selectedAuteursIds, setSelectedAuteursIds] = useState<number[]>(user?.id ? [user.id] : []);
  const [coAuteursExternes, setCoAuteursExternes] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchPublications = async (pageNumber: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNumber.toString());
      params.append('taille', '10');
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (filterAnnee) params.append('annee', filterAnnee);
      if (filterType) params.append('type', filterType);
      if (filterEquipeId) params.append('equipeId', filterEquipeId);
      if (filterAuteurId) params.append('auteurId', filterAuteurId);

      const res = await api.get<PageDTO<PublicationDTO>>(`/publications?${params.toString()}`);
      setPublications(res.data.contenu || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
      setPage(res.data.numeroPage ?? res.data.page ?? pageNumber);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications(0);
    api.get<EquipeDTO[]>('/equipes').then((r) => setEquipes(r.data || []));
    api.get<{ contenu: MembreResumeDTO[] }>('/membres?taille=100').then((r) => setMembres(r.data?.contenu || []));
  }, []);

  const handleOpenModal = () => {
    setTitre('');
    setTypePub('ARTICLE_JOURNAL');
    setAnnee(new Date().getFullYear());
    setResume('');
    setLienDoi('');
    setEquipeId(user?.equipeId?.toString() || '');
    setSelectedAuteursIds(user?.id ? [user.id] : []);
    setCoAuteursExternes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCreatePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) {
      setModalError('Le titre de la publication est obligatoire.');
      return;
    }

    setSaving(true);
    setModalError(null);

    const payload = {
      titre: titre.trim(),
      type: typePub,
      annee: Number(annee),
      resume: resume.trim() || undefined,
      lienDoi: lienDoi.trim() || undefined,
      equipeId: equipeId ? Number(equipeId) : undefined,
      auteursIds: selectedAuteursIds,
      coAuteursExternes: coAuteursExternes
        ? coAuteursExternes.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      await api.post('/publications', payload);
      success('La publication a été enregistrée avec succès !');
      setIsModalOpen(false);
      fetchPublications(0);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erreur lors de l'enregistrement de la publication.";
      setModalError(msg);
      error(msg);
    } finally {
      setSaving(false);
    }
  };

  const years = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterAnnee('');
    setFilterType('');
    setFilterEquipeId('');
    setFilterAuteurId('');
    setTimeout(() => fetchPublications(0), 0);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gestion des Publications Scientifiques
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Répertoire des articles, actes de conférences et communications du Laboratoire LIAS.
          </p>
        </div>

        {canPublish ? (
          <button
            onClick={handleOpenModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Déposer une Publication</span>
          </button>
        ) : (
          <div className="px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>Supervision & Consultation</span>
          </div>
        )}
      </div>

      {!canPublish && (
        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <span>En tant qu'administrateur, vous disposez d'un rôle de supervision et d'archivage des publications scientifiques. La soumission d'articles est réservée aux enseignants-chercheurs et doctorants du laboratoire.</span>
        </div>
      )}

      {/* Multi-criteria Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Titre, mots-clés, résumé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPublications(0)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="">Tous les types</option>
              {PUBLICATION_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterAnnee}
              onChange={(e) => setFilterAnnee(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="">Toutes les années</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  Année {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterEquipeId}
              onChange={(e) => setFilterEquipeId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="">Toutes les équipes</option>
              {equipes.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.acronyme} - {eq.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterAuteurId}
              onChange={(e) => setFilterAuteurId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="">Tous les auteurs</option>
              {membres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.prenom} {m.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500 font-medium">
            {totalElements} publication{totalElements > 1 ? 's' : ''} indexée{totalElements > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            {(searchQuery || filterAnnee || filterType || filterEquipeId || filterAuteurId) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
              >
                Réinitialiser
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchPublications(0)}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
            >
              Filtrer
            </button>
          </div>
        </div>
      </div>

      {/* Publications List */}
      {loading ? (
        <LoadingSpinner text="Chargement des publications..." />
      ) : publications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">Aucune publication trouvée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-start justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                    {pub.annee}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                    {getPublicationTypeLabel(pub.type)}
                  </span>
                  {pub.equipeNom && (
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      Équipe {pub.equipeNom}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {pub.titre}
                </h3>

                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Auteurs : </span>
                  {pub.auteurs.map((a) => `${a.prenom} ${a.nom}`).join(', ')}
                  {pub.coAuteursExternes && pub.coAuteursExternes.length > 0 && `, ${pub.coAuteursExternes.join(', ')}`}
                </p>

                {pub.resume && (
                  <p className="text-xs text-slate-500 leading-relaxed pt-1 line-clamp-2">
                    {pub.resume}
                  </p>
                )}
              </div>

              {pub.lienDoi && (
                <a
                  href={pub.lienDoi.startsWith('http') ? pub.lienDoi : `https://doi.org/${pub.lienDoi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition flex-shrink-0"
                >
                  <span>DOI</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={(p) => {
              setPage(p);
              fetchPublications(p);
            }}
          />
        </div>
      )}

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enregistrer une Publication Scientifique"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreatePublication} className="space-y-4">
          {modalError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Titre de l'article *</label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Deep Learning Approaches for Smart Grid Optimization"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type de publication *
              </label>
              <select
                value={typePub}
                onChange={(e) => setTypePub(e.target.value as TypePublication)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
                required
              >
                {PUBLICATION_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Année *</label>
              <input
                type="number"
                value={annee}
                onChange={(e) => setAnnee(Number(e.target.value))}
                min={1990}
                max={2030}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lien / DOI</label>
              <input
                type="text"
                value={lienDoi}
                onChange={(e) => setLienDoi(e.target.value)}
                placeholder="10.1109/ACCESS.2024.1234567"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Équipe de rattachement</label>
              <select
                value={equipeId}
                onChange={(e) => setEquipeId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              >
                <option value="">Sélectionner une équipe...</option>
                {equipes.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.acronyme} - {eq.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Co-auteurs externes (séparés par des virgules)
            </label>
            <input
              type="text"
              value={coAuteursExternes}
              onChange={(e) => setCoAuteursExternes(e.target.value)}
              placeholder="Ex : Prof. John Doe (MIT), Dr. Jane Smith (CNRS)"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Résumé (Abstract)</label>
            <textarea
              rows={3}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Synthèse des contributions et méthodologies..."
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
              {saving ? 'Enregistrement...' : 'Enregistrer la publication'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
