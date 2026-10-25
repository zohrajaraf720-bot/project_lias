import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  MapPin,
  Users,
  Download,
  UploadCloud,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import api, { downloadFile } from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { ReunionDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { useToast } from '../../lib/toastContext';

export const ReunionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [reunion, setReunion] = useState<ReunionDTO | null>(null);
  const [pvFile, setPvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await api.get<ReunionDTO>(`/reunions/${id}`);
      setReunion(res.data);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleUploadPv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pvFile) {
      error('Veuillez sélectionner le fichier du Procès-Verbal au format PDF.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('fichierPv', pvFile);

    try {
      await api.post(`/reunions/${id}/pv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      success('Le Procès-Verbal a été déposé et la réunion a été archivée avec succès !');
      setPvFile(null);
      fetchDetail();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors du dépôt du PV.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadPv = async () => {
    if (!reunion?.pvDocumentId) return;
    try {
      await downloadFile(`/documents/${reunion.pvDocumentId}/telecharger`, `PV_Reunion_${reunion.id}.pdf`);
      success('Téléchargement du PV lancé.');
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors du téléchargement du PV.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement de la réunion..." />;
  }

  if (!reunion) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Réunion introuvable</h2>
        <Link to="/reunions" className="text-blue-600 text-sm mt-4 inline-block font-semibold">
          ← Retour aux réunions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link to="/reunions" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux réunions</span>
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={reunion.statut} />
          <span className="text-xs text-slate-400">
            Convoquée par {reunion.organisateur?.prenom} {reunion.organisateur?.nom}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          {reunion.titre}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <span className="text-slate-400 font-medium block">Date & Heure</span>
              <span className="font-bold text-slate-800">
                {new Date(reunion.dateHeure || (reunion as any).dateReunion).toLocaleDateString('fr-FR', {
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
              <span className="font-bold text-slate-800">{reunion.lieu}</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ordre du Jour</h2>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 leading-relaxed text-xs sm:text-sm text-slate-700 whitespace-pre-line">
            {reunion.ordreDuJour}
          </div>
        </div>

        {/* PV Status & Download / Upload */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Procès-Verbal de Séance (PV)
          </h2>

          {reunion.pvDocumentId ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">Procès-Verbal validé et archivé</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {reunion.pvDocumentNom || 'PV_Officiel_Signe.pdf'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadPv}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger le PV (PDF)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>Cette réunion est en attente du dépôt du Procès-Verbal officiel signé.</span>
              </div>

              {/* Upload form */}
              <form onSubmit={handleUploadPv} className="p-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Déposer le Procès-Verbal (Format PDF)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPvFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    required
                  />
                  <button
                    type="submit"
                    disabled={uploading || !pvFile}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploading ? 'Envoi...' : 'Déposer & Archiver'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Participants Roster */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-sm">
            Membres Convoqués ({reunion.participants?.length || 0})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {reunion.participants?.map((p) => (
            <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2.5">
              <Avatar
                src={p.photo}
                alt={`${p.prenom} ${p.nom}`}
                size="sm"
                rounded="rounded-lg"
              />
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {p.prenom} {p.nom}
                </div>
                <div className="text-[10px] text-slate-400">{p.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
