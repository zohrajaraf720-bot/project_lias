import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationBell } from '../components/NotificationBell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../lib/authContext';
import { Menu, Search, ExternalLink, KeyRound, AlertTriangle, Globe } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isDirecteur, isViceDirecteur, isChefEquipe, isAdmin } = useAuth();
  const navigate = useNavigate();

  const roleLabel = isDirecteur
    ? 'Directeur'
    : isViceDirecteur
    ? 'Vice-Directeur'
    : isChefEquipe
    ? "Chef d'Équipe"
    : isAdmin
    ? 'Admin'
    : user?.statut || 'Membre';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Quick Search */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-72 md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher (membres, publications, matériel...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100/80 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200/80 transition"
              title="Consulter le site public du laboratoire"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Voir le Site Public</span>
            </Link>

            <NotificationBell />

            <div className="h-6 w-px bg-slate-200" />

            <Link
              to="/profil"
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition"
            >
              <Avatar
                src={user?.photo}
                alt={`${user?.prenom} ${user?.nom}`}
                size="sm"
                rounded="rounded-lg"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.prenom} {user?.nom}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {roleLabel}
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* Mandatory Password Change Warning */}
        {user?.doitChangerMotDePasse && (
          <div className="bg-amber-500 text-white px-4 py-3 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>
                Sécurité : Vous devez obligatoirement modifier votre mot de passe temporaire pour continuer à utiliser toutes les fonctionnalités du laboratoire.
              </span>
            </div>
            <Link
              to="/change-password"
              className="flex items-center gap-1 bg-white text-amber-900 px-3 py-1 rounded-lg text-xs font-bold shadow-xs hover:bg-amber-50 transition ml-4 flex-shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Changer le mot de passe
            </Link>
          </div>
        )}

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
