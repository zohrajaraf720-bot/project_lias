import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Award,
  ArrowRight,
  Calendar,
  Sparkles,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { EquipeDTO, PublicationDTO, EvenementDTO } from '../../types';

export const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [evenements, setEvenements] = useState<EvenementDTO[]>([]);
  const [stats, setStats] = useState({
    membres: 35,
    equipes: 3,
    publications: 48,
    projets: 12,
  });

  useEffect(() => {
    // Load public lab data
    const loadData = async () => {
      try {
        const [eqRes, pubRes, evRes] = await Promise.all([
          api.get<EquipeDTO[]>('/public/equipes'),
          api.get<any>('/public/publications?taille=4'),
          api.get<any>('/public/evenements'),
        ]);
        setEquipes(eqRes.data || []);
        const rawPub = pubRes.data;
        setPublications(Array.isArray(rawPub) ? rawPub : (rawPub?.contenu || []));
        const rawEv = evRes.data;
        setEvenements(Array.isArray(rawEv) ? rawEv : (rawEv?.contenu || []));
        setStats({
          membres: (eqRes.data || []).reduce((acc, curr) => acc + (curr.nombreMembres || 0), 10),
          equipes: (eqRes.data || []).length || 3,
          publications: pubRes.data?.contenu?.length ? 50 : 25,
          projets: 8,
        });
      } catch {
        // Fallback default
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950 text-white pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.25),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold mb-8 backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Excellence en Recherche Fondamentale & Appliquée</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl">
            Laboratoire d'Intelligence <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-sky-200">
              Artificielle et Systèmes
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl leading-relaxed">
            Centre de recherche de la Faculté des Sciences Ben M'Sik – Université Hassan II de Casablanca. Nous concevons et développons les technologies de rupture en intelligence artificielle, modélisation des systèmes complexes et ingénierie des données.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 items-center">
            <Link
              to="/adhesion"
              className="px-6 py-3.5 rounded-xl font-bold text-slate-950 bg-white hover:bg-slate-100 shadow-xl transition flex items-center gap-2 group text-sm"
            >
              <span>Postuler au laboratoire</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              to="/publications"
              className="px-6 py-3.5 rounded-xl font-bold text-white bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/30 transition text-sm flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Consulter nos travaux</span>
            </Link>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-6 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition text-sm flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Mon Espace Intranet ({user?.prenom})</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-xl font-bold text-slate-300 hover:text-white transition text-sm flex items-center gap-2"
              >
                <span>Espace Chercheurs & Direction</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Key Metrics Banner */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="text-3xl font-black text-white">{stats.membres}+</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Enseignants & Chercheurs</div>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="text-3xl font-black text-blue-400">{stats.equipes}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Équipes de Recherche Spécialisées</div>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="text-3xl font-black text-teal-400">{stats.publications}+</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Publications Revues & Conférences</div>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="text-3xl font-black text-amber-400">100%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Conformité Doctorale & Projets</div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Teams Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Structure Scientifique</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              Nos Équipes de Recherche
            </h2>
            <p className="text-slate-500 text-sm mt-2 max-w-2xl">
              Des pôles pluridisciplinaires structurés autour des axes stratégiques nationaux et internationaux.
            </p>
          </div>
          <Link
            to="/equipes"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
          >
            <span>Toutes les équipes</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {equipes.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-slate-400">Chargement des équipes...</div>
          ) : (
            equipes.map((eq) => (
              <div
                key={eq.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-black text-xs font-mono">
                      {eq.acronyme}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {eq.nombreMembres} chercheurs
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {eq.nom}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed mt-2 line-clamp-3">
                    {eq.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {eq.axesRecherche?.slice(0, 3).map((axe, i) => (
                      <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {axe}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Chef : {eq.chefEquipe ? `${eq.chefEquipe.prenom} ${eq.chefEquipe.nom}` : 'À désigner'}
                  </span>
                  <Link
                    to={`/equipes/${eq.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Détails <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recent Scientific Activities */}
      <section className="bg-slate-100/60 py-16 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Vie Scientifique</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Séminaires, Soutenances & Ateliers
              </h2>
            </div>
            <Link
              to="/activites"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Agenda complet <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {evenements.map((ev) => (
              <div key={ev.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(ev.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">{ev.titre}</h4>
                <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">{ev.description}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Lieu : {ev.lieu}</span>
                  <Link to={`/evenements/${ev.id}`} className="font-semibold text-blue-600 hover:underline">
                    Participer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Publications Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Production Académique</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Dernières Publications Référencées
            </h2>
          </div>
          <Link to="/publications" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Toutes les publications <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                    {pub.annee}
                  </span>
                  {pub.equipeNom && (
                    <span className="text-xs text-slate-400">• Équipe {pub.equipeNom}</span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-sm leading-snug">{pub.titre}</h4>
                <p className="text-xs text-slate-500">
                  Auteurs :{' '}
                  {pub.auteurs.map((a) => `${a.prenom} ${a.nom}`).join(', ')}
                  {pub.coAuteursExternes && pub.coAuteursExternes.length > 0 && `, ${pub.coAuteursExternes.join(', ')}`}
                </p>
              </div>

              {pub.lienDoi && (
                <a
                  href={pub.lienDoi.startsWith('http') ? pub.lienDoi : `https://doi.org/${pub.lienDoi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex-shrink-0"
                >
                  <span>DOI</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Call To Action Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-black">Rejoindre le Laboratoire LIAS</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              Vous êtes chercheur titulaire, chercheur associé ou candidat au doctorat ? Déposez votre candidature pour intégrer l'une de nos équipes de recherche d'excellence.
            </p>
          </div>
          <Link
            to="/adhesion"
            className="px-6 py-4 rounded-xl font-bold bg-white text-blue-900 hover:bg-blue-50 shadow-lg transition text-sm flex-shrink-0 flex items-center gap-2"
          >
            <span>Formulaire d'adhésion</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
