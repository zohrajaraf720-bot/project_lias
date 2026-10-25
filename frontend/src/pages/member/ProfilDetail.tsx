import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Calendar,
  Mail,
  ArrowLeft,
  History,
  Building,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import api from '../../lib/api';
import { MembreInterneDTO, HistoriqueMembreDTO, PublicationDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';

export const ProfilDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [membre, setMembre] = useState<MembreInterneDTO | null>(null);
  const [historique, setHistorique] = useState<HistoriqueMembreDTO | null>(null);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembreDetail = async () => {
      try {
        const [mRes, hRes, pRes] = await Promise.all([
          api.get<MembreInterneDTO>(`/membres/${id}`),
          api.get<HistoriqueMembreDTO>(`/membres/${id}/historique`),
          api.get<PublicationDTO[]>(`/publications/membre/${id}`),
        ]);

        setMembre(mRes.data);
        setHistorique(hRes.data);
        setPublications(pRes.data || []);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMembreDetail();
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Chargement du profil..." />;
  }

  if (!membre) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Profil introuvable</h2>
        <Link to="/membres" className="text-blue-600 text-sm mt-4 inline-block font-semibold">
          ← Retour à l'annuaire
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Link to="/membres" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour à l'annuaire</span>
      </Link>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <Avatar
              src={membre.photo}
              alt={`${membre.prenom} ${membre.nom}`}
              size="2xl"
              className="w-20 h-20 rounded-3xl shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900">
                  {membre.prenom} {membre.nom}
                </h1>
                <StatusBadge status={membre.statut} />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <a href={`mailto:${membre.email}`} className="flex items-center gap-1.5 hover:text-blue-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{membre.email}</span>
                </a>
                {membre.equipeNom && (
                  <span className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>Équipe : <strong>{membre.equipeNom}</strong></span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Affiliation & Origins */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Établissement d'Origine</span>
            <span className="font-bold text-slate-800">{membre.etablissementOrigine || 'Faculté des Sciences Ben M\'Sik'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Laboratoire d'Origine</span>
            <span className="font-bold text-slate-800">{membre.laboratoireOrigine || 'LIAS'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Date d'affiliation (Clé)</span>
            <span className="font-bold text-slate-800">{membre.dateAffiliation || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Date d'embauche</span>
            <span className="font-bold text-slate-800">{membre.dateEmbauche || 'N/A'}</span>
          </div>
        </div>

        {/* Bio & Interests */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Biographie & Parcours</h3>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
              {membre.biographie || 'Aucune biographie renseignée.'}
            </p>
          </div>

          {membre.centresInteret && membre.centresInteret.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thématiques de Recherche</h3>
              <div className="flex flex-wrap gap-1.5">
                {membre.centresInteret.map((ci, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold">
                    {ci}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Career History & Publications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Career History Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">Historique de Carrière & Gouvernance</h2>
          </div>

          {historique?.entrees?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Aucun événement d'historique archivé.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {historique?.entrees?.map((entree, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                  <div className="text-[11px] font-bold text-blue-600">{entree.date}</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5">{entree.libelle}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{entree.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member's Publications */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Publications Référencées ({publications.length})</h2>
            </div>
          </div>

          {publications.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Aucune publication rattachée à ce membre.</p>
          ) : (
            <div className="space-y-3">
              {publications.map((pub) => (
                <div key={pub.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {pub.annee}
                  </span>
                  <h4 className="font-bold text-xs text-slate-800 mt-1">{pub.titre}</h4>
                  {pub.lienDoi && (
                    <a
                      href={pub.lienDoi.startsWith('http') ? pub.lienDoi : `https://doi.org/${pub.lienDoi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <span>Consulter DOI</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
