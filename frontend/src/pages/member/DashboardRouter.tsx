import React from 'react';
import { useAuth } from '../../lib/authContext';
import { DashboardAdmin } from './DashboardAdmin';
import { DashboardDirection } from './DashboardDirection';
import { DashboardDoctorant } from './DashboardDoctorant';
import { DashboardAssocie } from './DashboardAssocie';
import { DashboardMembre } from './DashboardMembre';

export const DashboardRouter: React.FC = () => {
  const { isAdmin, isDirecteur, isViceDirecteur, isDoctorant, isAssocie } = useAuth();

  if (isAdmin) {
    return <DashboardAdmin />;
  }

  if (isDirecteur || isViceDirecteur) {
    return <DashboardDirection />;
  }

  if (isDoctorant) {
    return <DashboardDoctorant />;
  }

  if (isAssocie) {
    return <DashboardAssocie />;
  }

  return <DashboardMembre />;
};
