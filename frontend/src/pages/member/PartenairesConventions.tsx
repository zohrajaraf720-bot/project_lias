import React, { useEffect, useState } from 'react';
import {
  Handshake,
  Plus,
  Building,
  Globe,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { PartenaireDTO, ConventionDTO, TypeInstitution } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toastContext';

export const PartenairesConventions: React.FC = () => {
  const { isDirecteur, isViceDirecteur, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  const [conventions, setConventions] = useState<ConventionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Partner Modal
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [nomPartenaire, setNomPartenaire] = useState('');
  const [typeInstitution, setTypeInstitution] = useState<TypeInstitution>('UNIVERSITE');
  const [pays, setPays] = useState('Maroc');
  const [siteWeb, setSiteWeb] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Convention Modal
  const [isConvModalOpen, setIsConvModalOpen] = useState(false);
  const [selectedPartenaireId, setSelectedPartenaireId] = useState('');
  const [titreConv, setTitreConv] = useState('');
  const [descConv, setDescConv] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [partRes, convRes] = await Promise.all([
        api.get<PartenaireDTO[]>('/partenaires'),
        api.get<ConventionDTO[]>('/conventions'),
      ]);
      setPartenaires(partRes.data || []);
      setConventions(convRes.data || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomPartenaire.trim()) return;

    setSaving(true);
    try {
      await api.post('/partenaires', {
        nom: nomPartenaire.trim(),
        typeInstitution,
        pays: pays.trim(),
        siteWeb: siteWeb.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      });

      success('Partenaire ajouté avec succès !');
      setIsPartnerModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de l'ajout du partenaire.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateConvention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartenaireId || !titreConv.trim() || !dateDebut || !dateFin) return;

    setSaving(true);
    try {
      await api.post('/conventions', {
        partenaireId: Number(selectedPartenaireId),
        titre: titreConv.trim(),
        description: descConv.trim() || undefined,
        dateDebut,
        dateFin,
      });

      success('Convention bilatérale enregistrée avec succès !');
      setIsConvModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la création de la convention.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement des conventions et partenariats..." />;
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Partenariats & Conventions Bilatérales
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Réseau académique, industriel et conventions de cotutelle / recherche du Laboratoire LIAS.
          </p>
        </div>

        {(isDirecteur || isViceDirecteur || isAdmin) && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsPartnerModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 shadow-xs transition"
            >
              + Nouveau Partenaire
            </button>
            <button
              onClick={() => setIsConvModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Convention</span>
            </button>
          </div>
        )}
      </div>

      {/* Conventions Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Conventions Actives & en Négociation</h2>
        {conventions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
            Aucune convention enregistrée pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {conventions.map((c) => {
              const isExpired = new Date(c.dateFin) < new Date();
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {c.partenaireNom}
                      </span>
                      <StatusBadge status={c.statut} />
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{c.titre}</h3>

                    {c.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        Du {c.dateDebut} au {c.dateFin}
                      </span>
                      {isExpired && (
                        <span className="text-red-600 font-bold ml-auto flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Expirée
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Partners List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Organismes & Universités Partenaires</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {partenaires.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{p.typeInstitution}</span>
                <span className="text-xs text-slate-400 font-semibold">{p.pays}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{p.nom}</h3>
              {p.contactEmail && (
                <div className="text-[11px] text-slate-400">{p.contactEmail}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Partner Modal */}
      <Modal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        title="Ajouter un Organisme Partenaire"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePartner} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de l'institution *</label>
            <input
              type="text"
              value={nomPartenaire}
              onChange={(e) => setNomPartenaire(e.target.value)}
              placeholder="Ex : Sorbonne Université / OCP Group"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type d'institution *</label>
              <select
                value={typeInstitution}
                onChange={(e) => setTypeInstitution(e.target.value as TypeInstitution)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              >
                <option value="UNIVERSITE">Université</option>
                <option value="ENTREPRISE">Entreprise / R&D</option>
                <option value="CENTRE_RECHERCHE">Centre de Recherche</option>
                <option value="ORGANISME_PUBLIC">Organisme Public</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pays *</label>
              <input
                type="text"
                value={pays}
                onChange={(e) => setPays(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email de contact</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@partenaire.org"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPartnerModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      {/* Convention Modal */}
      <Modal
        isOpen={isConvModalOpen}
        onClose={() => setIsConvModalOpen(false)}
        title="Créer une Convention Bilatérale"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateConvention} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Partenaire *</label>
            <select
              value={selectedPartenaireId}
              onChange={(e) => setSelectedPartenaireId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              required
            >
              <option value="">Sélectionner le partenaire...</option>
              {partenaires.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.pays})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Intitulé de la convention *</label>
            <input
              type="text"
              value={titreConv}
              onChange={(e) => setTitreConv(e.target.value)}
              placeholder="Ex : Convention de Recherche & Cotutelle de Thèses IA-Santé"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date d'effet (Début) *</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date d'échéance (Fin) *</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Objectifs et périmètre</label>
            <textarea
              rows={3}
              value={descConv}
              onChange={(e) => setDescConv(e.target.value)}
              placeholder="Missions, financements, mobilités de doctorants..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsConvModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
            >
              Valider la convention
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
