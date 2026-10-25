import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useAuth } from '../lib/authContext';
import { LayoutDashboard, ArrowRight } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const {
    isAuthenticated,
    user,
    isDirecteur,
    isViceDirecteur,
    isChefEquipe,
    isAdmin,
  } = useAuth();

  const roleLabel = isDirecteur
    ? 'Directeur'
    : isViceDirecteur
    ? 'Vice-Directeur'
    : isChefEquipe
    ? "Chef d'Équipe"
    : isAdmin
    ? 'Admin'
    : user?.statut === 'DOCTORANT'
    ? 'Doctorant'
    : user?.statut === 'ASSOCIE'
    ? 'Chercheur Associé'
    : user?.statut === 'PERMANENT'
    ? 'Membre Permanent'
    : user?.statut || 'Membre';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Banner when viewing public site as a logged-in member */}
      {isAuthenticated && user && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-slate-300 truncate">
                Vous consultez le <strong className="text-white font-semibold">Site Public</strong> en tant que{' '}
                <strong className="text-white font-semibold">{user.prenom} {user.nom}</strong> ({roleLabel})
              </span>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-xs flex-shrink-0"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Retour à l'Intranet</span>
              <span className="sm:hidden">Intranet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
