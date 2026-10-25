import React, { useEffect, useState, useRef } from 'react';
import {
  User,
  Mail,
  Building,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  History,
  Camera,
  Trash2,
  Lock,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { MembreProfilDTO, HistoriqueMembreDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { useToast } from '../../lib/toastContext';

export const MonProfil: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [profil, setProfil] = useState<MembreProfilDTO | null>(null);
  const [historique, setHistorique] = useState<HistoriqueMembreDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable Profile Credentials
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');

  // Editable Academic & Research Info
  const [biographie, setBiographie] = useState('');
  const [centresInteret, setCentresInteret] = useState<string[]>([]);
  const [nouveauCentre, setNouveauCentre] = useState('');
  const [etablissementOrigine, setEtablissementOrigine] = useState('');
  const [laboratoireOrigine, setLaboratoireOrigine] = useState('');
  const [photo, setPhoto] = useState('');

  // Password Change State
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchMonProfil = async () => {
      try {
        const [pRes, hRes] = await Promise.all([
          api.get<MembreProfilDTO>('/membres/me'),
          api.get<HistoriqueMembreDTO>(`/membres/${user?.id}/historique`),
        ]);
        setProfil(pRes.data);
        setNom(pRes.data.nom || '');
        setPrenom(pRes.data.prenom || '');
        setEmail(pRes.data.email || '');
        setBiographie(pRes.data.biographie || '');
        setCentresInteret(pRes.data.centresInteret || []);
        setEtablissementOrigine(pRes.data.etablissementOrigine || '');
        setLaboratoireOrigine(pRes.data.laboratoireOrigine || '');
        setPhoto(pRes.data.photo || '');
        setHistorique(hRes.data);
      } catch {
        // Fallback silencieux
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchMonProfil();
  }, [user]);

  const handleAddCentre = () => {
    if (nouveauCentre.trim() && !centresInteret.includes(nouveauCentre.trim())) {
      setCentresInteret([...centresInteret, nouveauCentre.trim()]);
      setNouveauCentre('');
    }
  };

  const handleRemoveCentre = (toRemove: string) => {
    setCentresInteret(centresInteret.filter((c) => c !== toRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim() || !email.trim()) {
      error('Le nom, le prénom et l\'adresse email sont obligatoires.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put<MembreProfilDTO>('/membres/profil', {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        biographie,
        centresInteret,
        etablissementOrigine: etablissementOrigine.trim() || undefined,
        laboratoireOrigine: laboratoireOrigine.trim() || undefined,
        photo: photo.trim() || undefined,
      });
      setProfil(res.data);
      await refreshUser();
      success('Votre profil et vos coordonnées ont été mis à jour avec succès !');
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancienMotDePasse || !nouveauMotDePasse) {
      error('Veuillez renseigner votre mot de passe actuel et votre nouveau mot de passe.');
      return;
    }
    if (nouveauMotDePasse.length < 6) {
      error('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (nouveauMotDePasse !== confirmationMotDePasse) {
      error('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/auth/mot-de-passe', {
        ancienMotDePasse,
        nouveauMotDePasse,
      });
      success('Votre mot de passe a été modifié avec succès !');
      setAncienMotDePasse('');
      setNouveauMotDePasse('');
      setConfirmationMotDePasse('');
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profil?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      error("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    const formData = new FormData();
    formData.append('fichier', file);

    setUploadingPhoto(true);
    try {
      const res = await api.post<MembreProfilDTO>(`/membres/${profil.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfil(res.data);
      setPhoto(res.data.photo || '');
      await refreshUser();
      success('Photo de profil mise à jour avec succès !');
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de l'envoi de la photo.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!profil?.id) return;
    setUploadingPhoto(true);
    try {
      let res;
      try {
        res = await api.delete<MembreProfilDTO>(`/membres/${profil.id}/photo`);
      } catch {
        res = await api.put<MembreProfilDTO>('/membres/profil', {
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim(),
          biographie,
          centresInteret,
          etablissementOrigine: etablissementOrigine.trim() || undefined,
          laboratoireOrigine: laboratoireOrigine.trim() || undefined,
          photo: '',
        });
      }
      setProfil(res.data);
      setPhoto('');
      await refreshUser();
      success('Photo de profil supprimée.');
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la suppression de la photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement de votre profil..." />;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Mon Profil & Identifiants
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Gérez vos informations personnelles, vos coordonnées de connexion, votre mot de passe et votre biographie publique.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar with Overlay */}
            <div className="relative group">
              <Avatar
                src={profil?.photo}
                alt={`${prenom} ${nom}`}
                size="2xl"
                className="w-24 h-24 rounded-3xl shadow-md border-2 border-slate-100"
              />
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-slate-900/60 rounded-3xl flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h2 className="text-xl font-black text-slate-900">
                    {prenom || profil?.prenom} {nom || profil?.nom}
                  </h2>
                  {profil?.statut && <StatusBadge status={profil.statut} />}
                </div>
                <div className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{email || profil?.email}</span>
                </div>
              </div>

              {/* Action Buttons directly near the profile picture */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Changer la photo</span>
                </button>

                {profil?.photo && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Readonly Institutional Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Équipe de rattachement</span>
            <span className="font-bold text-slate-800">{profil?.equipeNom || 'Non affecté'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Date d'affiliation (Clé)</span>
            <span className="font-bold text-slate-800">{profil?.dateAffiliation || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Date d'embauche</span>
            <span className="font-bold text-slate-800">{profil?.dateEmbauche || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Date de naissance (Confidentiel)</span>
            <span className="font-bold text-slate-800">{profil?.dateNaissance || 'Non renseignée'}</span>
          </div>
        </div>

        {/* Editable Profile & Credentials Form */}
        <form onSubmit={handleSave} className="space-y-6 pt-2">
          {/* Section: Identité & Coordonnées */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Identité & Coordonnées de Connexion
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nom *</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex : KARIMI"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Prénom *</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Ex : Yassine"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Adresse Email institutionnelle (Identifiant de connexion) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yassine.karimi@lias.ma"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Informations Académiques */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Affiliation & Présentation Scientifique
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Établissement d'Origine
                </label>
                <input
                  type="text"
                  value={etablissementOrigine}
                  onChange={(e) => setEtablissementOrigine(e.target.value)}
                  placeholder="Ex : Faculté des Sciences Ben M'Sik"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Laboratoire d'Origine
                </label>
                <input
                  type="text"
                  value={laboratoireOrigine}
                  onChange={(e) => setLaboratoireOrigine(e.target.value)}
                  placeholder="Ex : LIAS ou Labo R&D"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Biographie & Présentation Scientifique
              </label>
              <textarea
                rows={4}
                value={biographie}
                onChange={(e) => setBiographie(e.target.value)}
                placeholder="Décrivez vos thématiques de recherche, vos méthodologies et vos contributions..."
                className="w-full p-4 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Thématiques & Centres d'Intérêt
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {centresInteret.map((ci) => (
                  <span
                    key={ci}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold"
                  >
                    <span>{ci}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCentre(ci)}
                      className="hover:text-red-600 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={nouveauCentre}
                  onChange={(e) => setNouveauCentre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCentre();
                    }
                  }}
                  placeholder="Ex : Deep Learning, IoT, Cloud..."
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddCentre}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Change Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Sécurité & Mot de Passe</h2>
              <p className="text-[11px] text-slate-400">Modifiez votre mot de passe pour sécuriser l'accès à votre compte</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Compte Sécurisé</span>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mot de passe actuel *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={ancienMotDePasse}
                onChange={(e) => setAncienMotDePasse(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={nouveauMotDePasse}
                  onChange={(e) => setNouveauMotDePasse(e.target.value)}
                  placeholder="Min. 6 caractères"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmationMotDePasse}
                  onChange={(e) => setConfirmationMotDePasse(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{changingPassword ? 'Modification en cours...' : 'Mettre à jour le mot de passe'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Career & Role History Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <History className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-sm">Mon Historique d'Affiliation & Rôles</h2>
        </div>

        {historique?.entrees?.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Aucun événement dans l'historique.</p>
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
    </div>
  );
};
