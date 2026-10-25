import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  const variantClasses = {
    primary: 'bg-blue-50 text-blue-700 border border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  }[variant];

  return (
    <span className={`inline-flex items-center rounded-full uppercase tracking-wider font-mono ${sizeClasses} ${variantClasses}`}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'ACTIF':
    case 'APPROUVEE':
    case 'VALIDE':
    case 'VALIDEE':
    case 'DISPONIBLE':
    case 'ACTIVE':
    case 'PRESENT':
    case 'FINALISE':
      return <Badge variant="success">{status.replace('_', ' ')}</Badge>;

    case 'EN_ATTENTE':
    case 'EN_ATTENTE_VALIDATION':
    case 'EN_ATTENTE_PV':
    case 'PLANIFIE':
    case 'PLANIFIEE':
    case 'EN_COURS':
    case 'EN_NEGOCIATION':
    case 'INSCRIT':
    case 'SOUMIS':
    case 'BROUILLON':
      return <Badge variant="warning">{status === 'EN_ATTENTE_VALIDATION' ? 'En attente' : status.replace('_', ' ')}</Badge>;

    case 'GELE':
    case 'HORS_SERVICE':
    case 'REFORME':
    case 'EXPIREE':
      return <Badge variant="danger">{status.replace('_', ' ')}</Badge>;

    case 'DESACTIVE':
    case 'REFUSEE':
    case 'REFUSE':
    case 'REJETE':
    case 'REJETEE':
    case 'ANNULE':
    case 'ANNULEE':
    case 'RESILIEE':
      return <Badge variant="danger">{status === 'REJETE' ? 'Rejeté' : status.replace('_', ' ')}</Badge>;

    case 'ARCHIVE':
    case 'ARCHIVEE':
    case 'TERMINE':
    case 'TERMINEE':
      return <Badge variant="neutral">{status.replace('_', ' ')}</Badge>;

    case 'PERMANENT':
      return <Badge variant="primary">Permanent</Badge>;
    case 'DOCTORANT':
      return <Badge variant="purple">Doctorant</Badge>;
    case 'ASSOCIE':
      return <Badge variant="info">Associé</Badge>;
    case 'DIRECTEUR':
      return <Badge variant="purple">Directeur</Badge>;
    case 'VICE_DIRECTEUR':
      return <Badge variant="primary">Vice-Directeur</Badge>;
    case 'CHEF_EQUIPE':
      return <Badge variant="info">Chef d'équipe</Badge>;

    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};
