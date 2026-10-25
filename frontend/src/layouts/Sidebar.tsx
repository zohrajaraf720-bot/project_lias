import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Package,
  Handshake,
  MessageSquare,
  Bell,
  UserCheck,
  CheckSquare,
  ShieldCheck,
  Settings,
  History,
  Activity,
  Layers,
  Award,
  LogOut,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { Avatar } from '../components/Avatar';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, isDirecteur, isViceDirecteur, isChefEquipe, isAdmin, logout } = useAuth();

  const isGovernance = isDirecteur || isViceDirecteur || isChefEquipe || isAdmin;
  const isDoctorant = user?.statut === 'DOCTORANT';
  const isPermanent = user?.statut === 'PERMANENT' || isAdmin;
  const canAccessInternal = !isDoctorant;

  const roleLabel = isDirecteur
    ? 'Directeur'
    : isViceDirecteur
    ? 'Vice-Directeur'
    : isChefEquipe
    ? "Chef d'Équipe"
    : isAdmin
    ? 'Administration'
    : user?.statut || 'Membre';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-full overflow-y-auto">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <NavLink to="/dashboard" className="flex flex-col gap-2">
          <img
            src="/logo.png"
            alt="Laboratoire LIAS"
            className="h-8 w-auto object-contain"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
              Portail Intranet
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate max-w-[120px]">
              {roleLabel}
            </span>
          </div>
        </NavLink>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-4 space-y-6">
        {/* Core Navigation */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Espace Général
          </div>
          <NavLink to="/dashboard" onClick={onCloseMobile} className={linkClass}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Tableau de bord</span>
          </NavLink>
          {canAccessInternal && (
            <NavLink to="/membres" onClick={onCloseMobile} className={linkClass}>
              <Users className="w-4 h-4" />
              <span>Annuaire du Labo</span>
            </NavLink>
          )}
          <NavLink to="/profil" onClick={onCloseMobile} className={linkClass}>
            <UserCheck className="w-4 h-4" />
            <span>Mon Profil</span>
          </NavLink>
          {canAccessInternal && (
            <NavLink to="/messagerie" onClick={onCloseMobile} className={linkClass}>
              <MessageSquare className="w-4 h-4" />
              <span>Messagerie Interne</span>
            </NavLink>
          )}
          <NavLink to="/notifications" onClick={onCloseMobile} className={linkClass}>
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </NavLink>
        </div>

        {/* Scientific Production */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Recherche & Activités
          </div>
          <NavLink to="/publications-gestion" onClick={onCloseMobile} className={linkClass}>
            <BookOpen className="w-4 h-4" />
            <span>Publications</span>
          </NavLink>
          {canAccessInternal && (
            <NavLink to="/evenements" onClick={onCloseMobile} className={linkClass}>
              <Activity className="w-4 h-4" />
              <span>Événements Scientifiques</span>
            </NavLink>
          )}
          <NavLink to="/calendrier" onClick={onCloseMobile} className={linkClass}>
            <Calendar className="w-4 h-4" />
            <span>Calendrier & Thèses</span>
          </NavLink>
          {canAccessInternal && (
            <>
              <NavLink to="/documents" onClick={onCloseMobile} className={linkClass}>
                <FolderOpen className="w-4 h-4" />
                <span>Documents & Modèles</span>
              </NavLink>
              <NavLink to="/reunions" onClick={onCloseMobile} className={linkClass}>
                <FileText className="w-4 h-4" />
                <span>Réunions & PV</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Logistics & Resources */}
        {(isPermanent || canAccessInternal) && (
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Logistique & Réseau
            </div>
            {isPermanent && (
              <>
                <NavLink to="/materiel" onClick={onCloseMobile} className={linkClass}>
                  <Package className="w-4 h-4" />
                  <span>Inventaire Matériel</span>
                </NavLink>
                <NavLink to="/mes-demandes-materiel" onClick={onCloseMobile} className={linkClass}>
                  <CheckSquare className="w-4 h-4" />
                  <span>Mes Emprunts</span>
                </NavLink>
              </>
            )}
            <NavLink to="/conventions" onClick={onCloseMobile} className={linkClass}>
              <Handshake className="w-4 h-4" />
              <span>Partenaires & Conventions</span>
            </NavLink>
          </div>
        )}

        {/* Governance / Direction */}
        {isGovernance && (
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gouvernance LIAS</span>
            </div>
            <NavLink to="/gouvernance/evenements" onClick={onCloseMobile} className={linkClass}>
              <CheckSquare className="w-4 h-4" />
              <span>Validation Événements</span>
            </NavLink>
            {(isDirecteur || isViceDirecteur || isAdmin) && (
              <NavLink to="/gouvernance/adhesions" onClick={onCloseMobile} className={linkClass}>
                <UserCheck className="w-4 h-4" />
                <span>Demandes d'adhésion</span>
              </NavLink>
            )}
            <NavLink to="/gouvernance/materiel" onClick={onCloseMobile} className={linkClass}>
              <Package className="w-4 h-4" />
              <span>Validation Matériel</span>
            </NavLink>
            {(isDirecteur || isViceDirecteur || isAdmin) && (
              <NavLink to="/gouvernance/equipes" onClick={onCloseMobile} className={linkClass}>
                <Layers className="w-4 h-4" />
                <span>Gestion des Équipes</span>
              </NavLink>
            )}
            {(isDirecteur || isViceDirecteur || isAdmin) && (
              <>
                <NavLink to="/gouvernance/mandats" onClick={onCloseMobile} className={linkClass}>
                  <Award className="w-4 h-4" />
                  <span>Mandats & Rôles</span>
                </NavLink>
                <NavLink to="/gouvernance/departs" onClick={onCloseMobile} className={linkClass}>
                  <History className="w-4 h-4" />
                  <span>Départs & Retraites</span>
                </NavLink>
              </>
            )}
            {(isDirecteur || isViceDirecteur || isAdmin) && (
              <NavLink to="/gouvernance/rapport-annuel" onClick={onCloseMobile} className={linkClass}>
                <FileText className="w-4 h-4" />
                <span>Rapport d'Activité Annuel</span>
              </NavLink>
            )}
          </div>
        )}

        {/* Administration */}
        {isAdmin && (
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              <span>Administration</span>
            </div>
            <NavLink to="/admin/comptes" onClick={onCloseMobile} className={linkClass}>
              <Users className="w-4 h-4" />
              <span>Gestion des Comptes</span>
            </NavLink>
            <NavLink to="/admin/parametres" onClick={onCloseMobile} className={linkClass}>
              <Settings className="w-4 h-4" />
              <span>Paramétrage Labo</span>
            </NavLink>
            <NavLink to="/admin/audit" onClick={onCloseMobile} className={linkClass}>
              <History className="w-4 h-4" />
              <span>Journal d'Audit</span>
            </NavLink>
            <NavLink to="/admin/maintenance" onClick={onCloseMobile} className={linkClass}>
              <ShieldCheck className="w-4 h-4" />
              <span>Maintenance Système</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Footer User Menu & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Avatar
              src={user?.photo}
              alt={`${user?.prenom} ${user?.nom}`}
              size="sm"
              rounded="rounded-lg"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-800 truncate">
                {user?.prenom} {user?.nom}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Se déconnecter"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
