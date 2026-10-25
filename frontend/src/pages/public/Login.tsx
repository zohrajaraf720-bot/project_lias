import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, KeyRound, Check } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { useToast } from '../../lib/toastContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const sessionExpired = queryParams.get('session_expired');
  const redirectPath = queryParams.get('redirect') || '/dashboard';

  const demoAccounts = [
    { label: 'Directeur', email: 'directeur@lias.ma', pass: 'Password123!' },
    { label: 'Chef d\'équipe', email: 'prof.alami@lias.ma', pass: 'Password123!' },
    { label: 'Permanent', email: 'dr.benjelloun@lias.ma', pass: 'Password123!' },
    { label: 'Doctorant', email: 'doctorant.karimi@lias.ma', pass: 'Password123!' },
    { label: 'Associé', email: 'associe.dupont@univ-paris.fr', pass: 'Password123!' },
    { label: 'Administrateur', email: 'admin@lias.ma', pass: 'Password123!' },
  ];

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setMotDePasse(demoPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !motDePasse) {
      setErrorMessage('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await login({ email, motDePasse });
      const user = data.utilisateur;
      success(`Bienvenue, ${user?.prenom || ''} ${user?.nom || ''} !`);

      if (data.doitChangerMotDePasse) {
        navigate('/change-password');
      } else {
        navigate(redirectPath);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Identifiants incorrects ou compte indisponible.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex flex-col items-center gap-2 group">
          <img
            src="/logo.png"
            alt="Laboratoire LIAS"
            className="h-14 w-auto object-contain group-hover:opacity-90 transition"
          />
          <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
            Faculté des Sciences Ben M'Sik • UH2C
          </span>
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Portail du Laboratoire
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Accès réservé aux chercheurs, doctorants et membres de la direction
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
          {sessionExpired && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Votre session a expiré. Veuillez vous reconnecter.</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Adresse Email Institutionnelle
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom.prenom@lias.ma"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Mot de passe
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Connexion en cours...</span>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Pills */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5 text-center">
              Comptes de test (cliquez pour pré-remplir)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleFillDemo(acc.email, acc.pass)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] font-medium transition text-left truncate"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
            ← Retour au site public du LIAS
          </Link>
        </div>
      </div>
    </div>
  );
};
