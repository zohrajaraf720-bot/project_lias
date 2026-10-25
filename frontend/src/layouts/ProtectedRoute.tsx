import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedAuthorities?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  allowedAuthorities,
}) => {
  const { user, loading, isAuthenticated, hasRole, hasAuthority } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Vérification de la session en cours..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Force password change if required and user is not already on /change-password
  if (user.doitChangerMotDePasse && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Check roles if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAnyRole = allowedRoles.some((role) => hasRole(role));
    if (!hasAnyRole) {
      return <Navigate to="/dashboard?unauthorized=true" replace />;
    }
  }

  // Check authorities if specified
  if (allowedAuthorities && allowedAuthorities.length > 0) {
    const hasAnyAuthority = allowedAuthorities.some((auth) => hasAuthority(auth));
    if (!hasAnyAuthority) {
      return <Navigate to="/dashboard?unauthorized=true" replace />;
    }
  }

  return <>{children}</>;
};
