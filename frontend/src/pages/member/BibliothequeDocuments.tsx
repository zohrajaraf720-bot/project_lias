import React, { useEffect, useState } from 'react';
import {
  FolderOpen,
  Plus,
  Download,
  FileText,
  Search,
  UploadCloud,
  Clock,
  ShieldCheck,
  Tag,
  Calendar,
  History,
  FileUp,
} from 'lucide-react';
import api, { downloadFile } from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { DocumentDTO, TypeDocument, PageDTO, VersionDocumentDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { Pagination } from '../../components/Pagination';
import { useToast } from '../../lib/toastContext';

const TYPE_DOCUMENT_LABELS: Record<string, string> = {
  DEMANDE_FINANCEMENT: 'Demande de financement',
  PROGRAMME: 'Programme scientifique',
  ATTESTATION: 'Attestation / Certificat',
  RAPPORT: 'Rapport d\'activité',
  ADMINISTRATIF: 'Document administratif',
  PV: 'Procès-Verbal (PV)',
  CONVENTION: 'Convention partenariale',
};

export const BibliothequeDocuments: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeDoc, setTypeDoc] = useState<string>('');
  const [query, setQuery] = useState('');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal State - Dépôt initial
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [type, setType] = useState<TypeDocument>('ADMINISTRATIF');
  const [fichier, setFichier] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Modal State - Nouvelle Version
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [selectedDocForVersion, setSelectedDocForVersion] = useState<DocumentDTO | null>(null);
  const [versionFichier, setVersionFichier] = useState<File | null>(null);
  const [versionCommentaire, setVersionCommentaire] = useState('');
  const [versionSaving, setVersionSaving] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  // Modal State - Historique des Versions
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedDocForHistory, setSelectedDocForHistory] = useState<DocumentDTO | null>(null);
  const [versionsList, setVersionsList] = useState<VersionDocumentDTO[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const fetchDocuments = async (pageNumber: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNumber.toString());
      params.append('taille', '12');
      if (typeDoc) params.append('type', typeDoc);
      if (query.trim()) params.append('q', query.trim());

      const res = await api.get<PageDTO<DocumentDTO>>(`/documents?${params.toString()}`);
      setDocuments(res.data.contenu || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
      setPage(res.data.numeroPage ?? res.data.page ?? pageNumber);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(0);
  }, [typeDoc]);

  const handleDownload = async (doc: DocumentDTO) => {
    try {
      const nomFichier = doc.titre.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
      await downloadFile(`/documents/${doc.id}/download`, nomFichier);
      success(`Téléchargement de "${doc.titre}" démarré.`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors du téléchargement du fichier.');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || !fichier) {
      setModalError('Le titre et le fichier sont obligatoires.');
      return;
    }

    setSaving(true);
    setModalError(null);

    const formData = new FormData();
    formData.append('titre', titre.trim());
    formData.append('typeDocument', type);
    formData.append('type', type);
    formData.append('fichier', fichier);

    try {
      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      success('Document déposé avec succès dans la bibliothèque !');
      setIsModalOpen(false);
      fetchDocuments(0);
    } catch (err: any) {
      const details = err.response?.data?.details;
      let msg = err.response?.data?.message || 'Erreur lors du dépôt du document.';
      if (details && Array.isArray(details) && details.length > 0) {
        msg = details.map((d: any) => d.message || `${d.champ}: invalide`).join('. ');
      }
      setModalError(msg);
      error(msg);
    } finally {
      setSaving(false);
    }
  };

  const canUploadVersion = (doc: DocumentDTO) => {
    if (!user) return false;
    if (user.roleSysteme === 'ADMIN') return true;
    if (doc.auteur && (doc.auteur.id === user.id || doc.auteur.email === user.email)) return true;
    return user.statut === 'PERMANENT';
  };

  const handleOpenNewVersion = (doc: DocumentDTO) => {
    setSelectedDocForVersion(doc);
    setVersionFichier(null);
    setVersionCommentaire('');
    setVersionError(null);
    setIsVersionModalOpen(true);
  };

  const handleOpenHistory = async (doc: DocumentDTO) => {
    setSelectedDocForHistory(doc);
    setIsHistoryModalOpen(true);
    setLoadingVersions(true);
    try {
      const res = await api.get<VersionDocumentDTO[]>(`/documents/${doc.id}/versions`);
      setVersionsList(res.data || []);
    } catch {
      setVersionsList([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSubmitNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForVersion || !versionFichier) {
      setVersionError('Le fichier de la nouvelle version est obligatoire.');
      return;
    }

    setVersionSaving(true);
    setVersionError(null);

    const formData = new FormData();
    formData.append('fichier', versionFichier);
    if (versionCommentaire.trim()) {
      formData.append('commentaire', versionCommentaire.trim());
    }

    try {
      const res = await api.post<DocumentDTO>(
        `/documents/${selectedDocForVersion.id}/versions`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      success(`Version ${res.data.version} ajoutée avec succès pour "${res.data.titre}" !`);
      setIsVersionModalOpen(false);
      setSelectedDocForVersion(null);
      setVersionFichier(null);
      setVersionCommentaire('');
      fetchDocuments(page);
    } catch (err: any) {
      const details = err.response?.data?.details;
      let msg = err.response?.data?.message || "Erreur lors de l'enregistrement de la nouvelle version.";
      if (details && Array.isArray(details) && details.length > 0) {
        msg = details.map((d: any) => d.message || `${d.champ}: invalide`).join('. ');
      }
      setVersionError(msg);
      error(msg);
    } finally {
      setVersionSaving(false);
    }
  };

  const handleDownloadVersion = async (doc: DocumentDTO, v: VersionDocumentDTO) => {
    try {
      const baseName = doc.titre.replace(/[^a-zA-Z0-9_-]/g, '_');
      const nomFichier = `${baseName}_v${v.version}.pdf`;
      await downloadFile(`/documents/${doc.id}/download?version=${v.version}`, nomFichier);
      success(`Téléchargement de la version ${v.version} démarré.`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors du téléchargement de la version.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Mémoire Institutionnelle & GED</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Archivage Documentaire & PV
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Capitalisation des connaissances du LIAS : demandes de financement, programmes, attestations, rapports et documents administratifs.
          </p>
        </div>

        <button
          onClick={() => {
            setTitre('');
            setType('ADMINISTRATIF');
            setFichier(null);
            setModalError(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Déposer un Document</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre de document..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDocuments(0)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={typeDoc}
            onChange={(e) => setTypeDoc(e.target.value)}
            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 w-full sm:w-auto font-medium"
          >
            <option value="">Tous les types</option>
            <option value="DEMANDE_FINANCEMENT">Demandes de financement</option>
            <option value="PROGRAMME">Programmes scientifiques</option>
            <option value="ATTESTATION">Attestations & Certificats</option>
            <option value="RAPPORT">Rapports d'activité & bilans</option>
            <option value="ADMINISTRATIF">Documents administratifs</option>
            <option value="PV">Procès-Verbaux de réunions</option>
            <option value="CONVENTION">Conventions de partenariats</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner text="Chargement des documents archivés..." />
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">Aucun document dans cette catégorie</p>
          <p className="text-xs text-slate-500 mt-1">Déposez un nouveau document pour enrichir les archives du laboratoire.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono">
                      {TYPE_DOCUMENT_LABELS[doc.typeDocument] || doc.typeDocument}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenHistory(doc)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition"
                      title="Consulter l'historique des versions"
                    >
                      <History className="w-3 h-3 text-slate-400" />
                      <span>v{doc.version || 1}</span>
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {doc.titre}
                  </h3>

                  <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Déposé le : {new Date(doc.dateUpload || doc.dateDepot || Date.now()).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {doc.auteur && (
                      <div>
                        Par : <span className="font-semibold text-slate-700">{doc.auteur.prenom} {doc.auteur.nom}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID-DOC-{doc.id}
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenHistory(doc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
                      title="Historique des versions"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Historique</span>
                    </button>

                    {canUploadVersion(doc) && (
                      <button
                        type="button"
                        onClick={() => handleOpenNewVersion(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition"
                        title="Ajouter une nouvelle version"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        <span>Nouvelle version</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                      title="Télécharger la version actuelle"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={(p) => {
              setPage(p);
              fetchDocuments(p);
            }}
          />
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Archiver un Document dans la Bibliothèque"
        maxWidth="xl"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          {modalError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Titre du document *
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Demande de subvention CNRST 2026, Programme Conférence BD 2026..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Type de document *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeDocument)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="DEMANDE_FINANCEMENT">Demande de financement</option>
              <option value="PROGRAMME">Programme scientifique</option>
              <option value="ATTESTATION">Attestation / Certificat</option>
              <option value="RAPPORT">Rapport d'activité & bilan</option>
              <option value="ADMINISTRATIF">Document administratif</option>
              <option value="PV">Procès-Verbal (PV)</option>
              <option value="CONVENTION">Convention partenariale</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fichier à déposer (PDF ou bureautique) *
            </label>
            <input
              type="file"
              onChange={(e) => setFichier(e.target.files?.[0] || null)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
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
              {saving ? 'Dépôt en cours...' : 'Archiver le Document'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nouvelle Version */}
      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title="Ajouter une Nouvelle Version"
        maxWidth="lg"
      >
        {selectedDocForVersion && (
          <form onSubmit={handleSubmitNewVersion} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 text-sm">{selectedDocForVersion.titre}</div>
              <div className="flex items-center gap-2 text-slate-500">
                <span>Version actuelle : <strong className="text-slate-700">v{selectedDocForVersion.version || 1}</strong></span>
                <span>→</span>
                <span>Nouvelle version : <strong className="text-emerald-600 font-bold">v{(selectedDocForVersion.version || 1) + 1}</strong></span>
              </div>
            </div>

            {versionError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                {versionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fichier de la nouvelle version (PDF ou bureautique) *
              </label>
              <input
                type="file"
                onChange={(e) => setVersionFichier(e.target.files?.[0] || null)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Commentaire de modification / révision (optionnel)
              </label>
              <textarea
                value={versionCommentaire}
                onChange={(e) => setVersionCommentaire(e.target.value)}
                placeholder="Ex : Correction du chapitre 3, actualisation des graphiques et données..."
                rows={3}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsVersionModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={versionSaving}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                {versionSaving ? 'Téléversement en cours...' : `Téléverser la Version ${(selectedDocForVersion.version || 1) + 1}`}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Historique des Versions */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Historique des Versions du Document"
        maxWidth="xl"
      >
        {selectedDocForHistory && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{selectedDocForHistory.titre}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID-DOC-{selectedDocForHistory.id} • {TYPE_DOCUMENT_LABELS[selectedDocForHistory.typeDocument] || selectedDocForHistory.typeDocument}
                </p>
              </div>
              {canUploadVersion(selectedDocForHistory) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsHistoryModalOpen(false);
                    handleOpenNewVersion(selectedDocForHistory);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Nouvelle version</span>
                </button>
              )}
            </div>

            {loadingVersions ? (
              <LoadingSpinner text="Chargement de l'historique des versions..." />
            ) : versionsList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Aucune version archivée pour ce document.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                {versionsList.map((v) => {
                  const isCurrent = v.version === selectedDocForHistory.version;
                  return (
                    <div key={v.id || v.version} className="py-3 flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                              isCurrent
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            v{v.version}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                              Version Actuelle
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(v.dateModification).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600">
                          Déposé par : <span className="font-semibold text-slate-800">{v.auteurNom || 'Auteur inconnu'}</span>
                        </div>

                        {v.commentaire && (
                          <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            « {v.commentaire} »
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadVersion(selectedDocForHistory, v)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition flex-shrink-0"
                        title={`Télécharger la version ${v.version}`}
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>Télécharger</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
