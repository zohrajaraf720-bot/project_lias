import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import api from '../../lib/api';
import { LaboratoireDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useToast } from '../../lib/toastContext';

export const ParametrageLabo: React.FC = () => {
  const { success, error } = useToast();

  const [labo, setLabo] = useState<LaboratoireDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nom, setNom] = useState('');
  const [acronyme, setAcronyme] = useState('');
  const [universite, setUniversite] = useState('');
  const [etablissement, setEtablissement] = useState('');
  const [dateCreation, setDateCreation] = useState('');
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [emailContact, setEmailContact] = useState('');
  const [telephone, setTelephone] = useState('');
  const [siteWeb, setSiteWeb] = useState('');

  useEffect(() => {
    const fetchLabo = async () => {
      try {
        const res = await api.get<LaboratoireDTO>('/admin/laboratoire');
        const data = res.data;
        setLabo(data);
        setNom(data.nom || '');
        setAcronyme(data.acronyme || '');
        setUniversite(data.universite || '');
        setEtablissement(data.etablissement || '');
        setDateCreation(data.dateCreation || '');
        setDescription(data.description || '');
        setAdresse(data.adresse || '');
        setEmailContact(data.emailContact || '');
        setTelephone(data.telephone || '');
        setSiteWeb(data.siteWeb || '');
      } catch {
        // Ignorer
      } finally {
        setLoading(false);
      }
    };
    fetchLabo();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put<LaboratoireDTO>('/admin/laboratoire', {
        nom,
        acronyme,
        universite,
        etablissement,
        dateCreation: dateCreation || undefined,
        description,
        adresse,
        emailContact,
        telephone,
        siteWeb,
      });

      setLabo(res.data);
      success('Les paramètres institutionnels du laboratoire ont été mis à jour.');
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la mise à jour des paramètres.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement des paramètres du laboratoire..." />;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>Configuration Institutionnelle</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Paramétrage du Laboratoire LIAS
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Identité officielle, affiliations universitaires et coordonnées affichées sur les rapports et le site public.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Laboratoire *</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Acronyme *</label>
            <input
              type="text"
              value={acronyme}
              onChange={(e) => setAcronyme(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Établissement (Faculté / École) *</label>
            <input
              type="text"
              value={etablissement}
              onChange={(e) => setEtablissement(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Université de rattachement *</label>
            <input
              type="text"
              value={universite}
              onChange={(e) => setUniversite(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Date de création officielle du laboratoire
          </label>
          <input
            type="date"
            value={dateCreation}
            onChange={(e) => setDateCreation(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description institutionnelle</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email de contact</label>
            <input
              type="email"
              value={emailContact}
              onChange={(e) => setEmailContact(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
            <input
              type="text"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Site Web Officiel</label>
            <input
              type="url"
              value={siteWeb}
              onChange={(e) => setSiteWeb(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse postale</label>
          <input
            type="text"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
