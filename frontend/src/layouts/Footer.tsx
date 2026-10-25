import React from 'react';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Lab Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="space-y-2.5">
              <img
                src="/logo-white.png"
                alt="Laboratoire LIAS"
                className="h-10 w-auto object-contain"
              />
              <p className="text-xs text-slate-400 font-medium">
                Laboratoire d'Intelligence Artificielle et Systèmes
              </p>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Pôle d'excellence en recherche fondamentale et appliquée affilié à la Faculté des Sciences Ben M'Sik, Université Hassan II de Casablanca.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">Navigation</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition">Accueil</Link>
              </li>
              <li>
                <Link to="/equipes" className="hover:text-white transition">Équipes de recherche</Link>
              </li>
              <li>
                <Link to="/activites" className="hover:text-white transition">Activités & Séminaires</Link>
              </li>
              <li>
                <Link to="/publications" className="hover:text-white transition">Publications scientifiques</Link>
              </li>
              <li>
                <Link to="/adhesion" className="hover:text-white transition">Candidater au LIAS</Link>
              </li>
            </ul>
          </div>

          {/* Institutional Affiliation */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">Affiliation</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="http://www.fsbm.univh2c.ma"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1 transition"
                >
                  Faculté des Sciences Ben M'Sik <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="http://www.univh2c.ma"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1 transition"
                >
                  Université Hassan II de Casablanca <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <span className="text-slate-500">Centre d'Études Doctorales (CEDoc)</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">Contact</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>Bd Cdt Driss El Harti, BP 7955, Ben M'Sik, Casablanca, Maroc</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <a href="mailto:contact@lias.ma" className="hover:text-white transition">
                  contact@lias.ma
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>+212 (0) 522 70 46 71</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Laboratoire LIAS – Faculté des Sciences Ben M'Sik. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-slate-400">Espace Administration</Link>
            <span className="text-slate-700">•</span>
            <span>Version 1.0 (Production)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
