import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  KeyRound,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRightLeft,
} from 'lucide-react';
import api from '../../lib/api';
import { MembreInterneDTO, EtatCompte, StatutMembre, RoleSysteme, EquipeDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { ModalAffectationDirecteEquipe } from '../../components/ModalAffectationDirecteEquipe';
import { useToast } from '../../lib/toastContext';

export const GestionComptes: React.FC = () => {
  const { success, error } = useToast();

  const [membres, setMembres] = useState<MembreInterneDTO[]>([]);
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Affectation directe d'équipe modal state
  const [selectedMembreForEquipe, setSelectedMembreForEquipe] = useState<number | null>(null);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [roleSysteme, setRoleSysteme] = useState<RoleSysteme>('MEMBRE');
  const [statut, setStatut] = useState<StatutMembre>('PERMANENT');
  const [equipeId, setEquipeId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchComptes = async () => {
    setLoading(true);
    try {
      const [mRes, eqRes] = await Promise.all([
        api.get<{ contenu: MembreInterneDTO[] }>('/membres?taille=100'),
        api.get<EquipeDTO[]>('/equipes'),
      ]);
      setMembres(mRes.data?.contenu || []);
      setEquipes(eqRes.data || []);
    } catch {
      // Ignorer
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComptes();
  }, []);

  const handleCreateCompte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim() || !email.trim()) return;

    setSaving(true);
    try {
      await api.post('/admin/comptes', {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        roleSysteme,
        statut,
        equipeId: equipeId ? Number(equipeId) : undefined,
      });

      success(`Le compte de ${prenom} ${nom} a été créé ! Un mot de passe temporaire a été généré.`);
      setIsModalOpen(false);
      fetchComptes();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la création du compte.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (id: number, nomMembre: string) => {
    if (!window.confirm(`Générer un nouveau mot de passe temporaire pour ${nomMembre} ?`)) return;

    try {
      const res = await api.post(`/admin/comptes/${id}/reinitialiser-mdp`);
      success(`Nouveau mot de passe pour ${nomMembre} : ${res.data.nouveauMotDePasse || 'Envoyé par email'}`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de la réinitialisation.');
    }
  };

  const handleChangeEtat = async (id: number, nouvelEtat: EtatCompte) => {
    try {
      await api.put(`/admin/comptes/${id}/etat`, { etat: nouvelEtat });
      success(`L'état du compte a été mis à jour vers ${nouvelEtat}.`);
      fetchComptes();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors du changement d'état.");
    }
  };

  const filtered = membres.filter(
    (m) =>
      m.nom.toLowerCase().includes(query.toLowerCase()) ||
      m.prenom.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner text="Chargement des comptes utilisateurs..." />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Sécurité & Comptes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gestion des Comptes Utilisateurs
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Création directe de comptes, réinitialisation de mots de passe et gestion des accès système.
          </p>
        </div>

        <button
          onClick={() => {
            setNom('');
            setPrenom('');
            setEmail('');
            setEquipeId('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Compte</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
        {filtered.map((m) => (
          <div
            key={m.id}
            className="p-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {m.prenom} {m.nom}
                </span>
                <StatusBadge status={m.statut} />
                <StatusBadge status={m.etatCompte} />
              </div>
              <div className="text-xs text-slate-500">
                {m.email} {m.equipeNom ? `• Équipe ${m.equipeNom}` : ''}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <button
                onClick={() => setSelectedMembreForEquipe(m.id)}
                className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                title="Affecter ou changer directement l'équipe de ce membre"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                <span>Affecter Équipe</span>
              </button>

              <button
                onClick={() => handleResetPassword(m.id, `${m.prenom} ${m.nom}`)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1 shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                <span>Réinitialiser MDP</span>
              </button>

              {m.etatCompte === 'ACTIF' ? (
                <button
                  onClick={() => handleChangeEtat(m.id, 'DESACTIVE')}
                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-semibold transition"
                >
                  Désactiver
                </button>
              ) : (
                <button
                  onClick={() => handleChangeEtat(m.id, 'ACTIF')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs"
                >
                  Activer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Créer un Compte Utilisateur"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCompte} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nom *</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex : ALAOUI"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom *</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex : Hassan"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Institutionnel *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hassan.alaoui@lias.ma"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rôle Système *</label>
              <select
                value={roleSysteme}
                onChange={(e) => setRoleSysteme(e.target.value as RoleSysteme)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              >
                <option value="MEMBRE">Membre (Standard)</option>
                <option value="ADMIN">Administrateur Technique</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Statut Académique *</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as StatutMembre)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              >
                <option value="PERMANENT">Enseignant-Chercheur Permanent</option>
                <option value="DOCTORANT">Doctorant</option>
                <option value="ASSOCIE">Chercheur Associé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Équipe de recherche</label>
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
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition"
            >
              {saving ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Affectation Directe d'Équipe */}
      <ModalAffectationDirecteEquipe
        isOpen={selectedMembreForEquipe !== null}
        initialMembreId={selectedMembreForEquipe ?? undefined}
        onClose={() => setSelectedMembreForEquipe(null)}
        onSuccess={fetchComptes}
      />
    </div>
  );
};
