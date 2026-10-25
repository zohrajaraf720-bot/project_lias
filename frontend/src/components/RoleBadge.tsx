import React from 'react';
import { MembreResumeDTO } from '../types';

export const RoleBadge: React.FC<{
  membre?: MembreResumeDTO | null;
  roleLibelle?: string;
  statut?: string;
  className?: string;
}> = ({ membre, roleLibelle, statut, className = '' }) => {
  const role = roleLibelle || membre?.roleLibelle || (
    membre?.roleSysteme === 'ADMIN'
      ? 'Admin'
      : (statut || membre?.statut) === 'DOCTORANT'
      ? 'Doctorant'
      : (statut || membre?.statut) === 'ASSOCIE'
      ? 'Chercheur associé'
      : (statut || membre?.statut) === 'PERMANENT'
      ? 'Membre permanent'
      : 'Membre'
  );

  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  const lower = role.toLowerCase();

  if (lower.includes('directeur') && !lower.includes('vice')) {
    style = 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
  } else if (lower.includes('vice')) {
    style = 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold';
  } else if (lower.includes('chef')) {
    style = 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
  } else if (lower.includes('doctorant')) {
    style = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (lower.includes('associé') || lower.includes('associe')) {
    style = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (lower.includes('permanent')) {
    style = 'bg-sky-100 text-sky-800 border-sky-300';
  } else if (lower.includes('admin')) {
    style = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border shadow-2xs whitespace-nowrap ${style} ${className}`}
    >
      {role}
    </span>
  );
};
