import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { Avatar } from '../components/Avatar';
import { RoleBadge } from '../components/RoleBadge';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const {
    isAuthenticated,
    user,
    isDirecteur,
    isViceDirecteur,
    isChefEquipe,
    isAdmin,
    logout,
  } = useAuth();

  const roleLabel = isDirecteur
    ? 'Directeur'
    : isViceDirecteur
    ? 'Vice-Directeur'
    : isChefEquipe
    ? "Chef d'Équipe"
    : isAdmin
    ? 'Administrateur'
    : user?.statut === 'DOCTORANT'
    ? 'Doctorant'
    : user?.statut === 'ASSOCIE'
    ? 'Chercheur Associé'
    : user?.statut === 'PERMANENT'
    ? 'Membre Permanent'
    : user?.statut || 'Membre';

  const navLinks = [
    { label: 'Accueil', to: '/' },
    { label: 'Équipes de Recherche', to: '/equipes' },
    { label: 'Activités & Séminaires', to: '/activites' },
    { label: 'Publications', to: '/publications' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <img
              src="/logo.png"
              alt="Laboratoire LIAS"
              className="h-11 w-auto object-contain group-hover:opacity-90 transition"
            />
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                FSBM • UH2C
              </span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">
                Faculté des Sciences Ben M'Sik
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  isActive(link.to)
                    ? 'text-blue-600 bg-blue-50/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated && (
              <Link
                to="/adhesion"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition border border-slate-200"
              >
                Rejoindre le labo
              </Link>
            )}

            {isAuthenticated && user ? (
              /* User Identity Pill */
              <div className="flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <Link
                  to="/profil"
                  className="flex items-center gap-2 group"
                  title="Accéder à mon profil"
                >
                  <Avatar
                    src={user?.photo}
                    alt={`${user?.prenom} ${user?.nom}`}
                    size="sm"
                    rounded="rounded-lg"
                  />
                  <div className="text-left leading-tight hidden lg:block">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition truncate max-w-[160px]">
                      {user?.prenom} {user?.nom}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                      {user?.email}
                    </div>
                  </div>
                </Link>

                <div className="h-5 w-px bg-slate-200 mx-0.5" />

                <button
                  onClick={logout}
                  title="Se déconnecter"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition"
              >
                <span>Connexion</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(link.to)
                  ? 'text-blue-600 bg-blue-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {!isAuthenticated && (
              <Link
                to="/adhesion"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200"
              >
                Rejoindre le laboratoire
              </Link>
            )}

            {isAuthenticated && user ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <Link
                  to="/profil"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <Avatar
                    src={user?.photo}
                    alt={`${user?.prenom} ${user?.nom}`}
                    size="md"
                    rounded="rounded-xl"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      {user?.prenom} {user?.nom}
                    </div>
                    <div className="text-xs text-slate-500">{user?.email}</div>
                    <div className="mt-1">
                      <RoleBadge roleLibelle={roleLabel} />
                    </div>
                  </div>
                </Link>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Intranet</span>
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
