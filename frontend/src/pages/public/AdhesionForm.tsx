import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UploadCloud, CheckCircle2, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { EquipeDTO, StatutMembre } from '../../types';
import { useToast } from '../../lib/toastContext';

const adhesionSchema = z.object({
  nom: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit comporter au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  statutSouhaite: z.enum(['PERMANENT', 'DOCTORANT', 'ASSOCIE']),
  equipeId: z.string().optional(),
  etablissementOrigine: z.string().optional(),
  laboratoireOrigine: z.string().optional(),
});

type AdhesionFormData = z.infer<typeof adhesionSchema>;

export const AdhesionForm: React.FC = () => {
  const [equipes, setEquipes] = useState<EquipeDTO[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [lettreFile, setLettreFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { success, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AdhesionFormData>({
    resolver: zodResolver(adhesionSchema),
    defaultValues: {
      statutSouhaite: 'DOCTORANT',
    },
  });

  const statutChoisi = watch('statutSouhaite');

  useEffect(() => {
    api.get<EquipeDTO[]>('/public/equipes').then((res) => setEquipes(res.data || [])).catch(() => {});
  }, []);

  const onSubmit = async (data: AdhesionFormData) => {
    if (!cvFile) {
      setErrorMessage('Veuillez joindre votre Curriculum Vitae au format PDF.');
      return;
    }

    if (cvFile.type !== 'application/pdf') {
      setErrorMessage('Le fichier CV doit obligatoirement être un document PDF.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('nom', data.nom);
    formData.append('prenom', data.prenom);
    formData.append('email', data.email);
    formData.append('statutSouhaite', data.statutSouhaite);
    if (data.equipeId) formData.append('equipeId', data.equipeId);
    
    if (data.statutSouhaite === 'PERMANENT') {
      formData.append('etablissementOrigine', data.etablissementOrigine || "Faculté des Sciences Ben M'Sik (FSBM)");
      formData.append('laboratoireOrigine', data.laboratoireOrigine || "LIAS");
    } else {
      if (data.etablissementOrigine) formData.append('etablissementOrigine', data.etablissementOrigine);
      if (data.laboratoireOrigine) formData.append('laboratoireOrigine', data.laboratoireOrigine);
    }

    formData.append('cv', cvFile);
    if (lettreFile) {
      formData.append('lettreMotivation', lettreFile);
    }

    try {
      await api.post('/adhesions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmittedSuccess(true);
      success('Votre demande d\'adhésion a été transmise avec succès à la direction du laboratoire.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi de la demande.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-slate-900">Demande d'Adhésion Transmise</h2>

          <p className="text-slate-600 text-sm leading-relaxed">
            Votre dossier de candidature a été soumis avec succès à la Direction du Laboratoire LIAS. 
            Il sera examiné lors de la prochaine commission scientifique. Vous recevrez une notification par email dès la validation de votre demande.
          </p>

          <div className="pt-4 flex justify-center gap-4">
            <Link
              to="/"
              className="px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour à l'accueil</span>
      </Link>

      <div className="space-y-2">
        <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Candidature</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Rejoindre le Laboratoire LIAS
        </h1>
        <p className="text-slate-600 text-sm">
          Remplissez le formulaire ci-dessous pour soumettre votre dossier d'adhésion en tant qu'Enseignant-Chercheur (Permanent), Doctorant ou Chercheur Associé.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-6">
        {/* Status selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Statut souhaité *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label
              className={`flex items-center justify-center text-center p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                statutChoisi === 'PERMANENT'
                  ? 'border-blue-600 bg-blue-50/60 text-blue-800 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                value="PERMANENT"
                {...register('statutSouhaite')}
                className="sr-only"
              />
              <span>Chercheur Permanent</span>
            </label>

            <label
              className={`flex items-center justify-center text-center p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                statutChoisi === 'DOCTORANT'
                  ? 'border-blue-600 bg-blue-50/60 text-blue-800 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                value="DOCTORANT"
                {...register('statutSouhaite')}
                className="sr-only"
              />
              <span>Doctorant</span>
            </label>

            <label
              className={`flex items-center justify-center text-center p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                statutChoisi === 'ASSOCIE'
                  ? 'border-blue-600 bg-blue-50/60 text-blue-800 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                value="ASSOCIE"
                {...register('statutSouhaite')}
                className="sr-only"
              />
              <span>Chercheur Associé</span>
            </label>
          </div>

          {statutChoisi === 'PERMANENT' && (
            <div className="mt-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 leading-relaxed">
              <span className="font-semibold text-blue-950">Statut Permanent (FSBM) : </span>
              Dédié aux enseignants-chercheurs titulaires de la Faculté des Sciences Ben M'Sik. L'établissement et le laboratoire de rattachement seront automatiquement enregistrés en tant que <span className="font-medium">FSBM / LIAS</span>.
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nom *</label>
            <input
              type="text"
              {...register('nom')}
              placeholder="Ex : EL IDRISSI"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.nom && <span className="text-[11px] text-red-600 mt-1">{errors.nom.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Prénom *</label>
            <input
              type="text"
              {...register('prenom')}
              placeholder="Ex : Youssef"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.prenom && <span className="text-[11px] text-red-600 mt-1">{errors.prenom.message}</span>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Adresse Email *</label>
          <input
            type="email"
            {...register('email')}
            placeholder="youssef.elidrissi@univh2c.ma"
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {errors.email && <span className="text-[11px] text-red-600 mt-1">{errors.email.message}</span>}
        </div>

        {/* Team affiliation */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Équipe d'affectation souhaitée
          </label>
          <select
            {...register('equipeId')}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
          >
            <option value="">Sélectionner une équipe de recherche...</option>
            {equipes.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.acronyme} - {eq.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Associate extra fields */}
        {statutChoisi === 'ASSOCIE' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Établissement d'origine
              </label>
              <input
                type="text"
                {...register('etablissementOrigine')}
                placeholder="Ex : ENSAM Casablanca"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Laboratoire d'origine
              </label>
              <input
                type="text"
                {...register('laboratoireOrigine')}
                placeholder="Ex : Labo R&D"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* File Uploads */}
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Curriculum Vitae (PDF obligatoire) *
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50">
              <input
                type="file"
                accept=".pdf"
                id="cv-upload"
                className="hidden"
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="cv-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700">
                  {cvFile ? cvFile.name : 'Cliquez pour sélectionner votre CV au format PDF'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">Format PDF uniquement (max 10 Mo)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lettre de motivation / Projet de recherche (PDF optionnel)
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50/50">
              <input
                type="file"
                accept=".pdf"
                id="lettre-upload"
                className="hidden"
                onChange={(e) => setLettreFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="lettre-upload" className="cursor-pointer flex flex-col items-center">
                <span className="text-xs text-slate-600">
                  {lettreFile ? lettreFile.name : 'Ajouter une lettre de motivation (PDF)'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Transmission du dossier...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Soumettre ma candidature</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
