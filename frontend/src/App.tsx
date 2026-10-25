import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import { ToastProvider } from './lib/toastContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './layouts/ProtectedRoute';

// Public Pages
import { Home } from './pages/public/Home';
import { EquipesPublic } from './pages/public/EquipesPublic';
import { EquipeDetail } from './pages/public/EquipeDetail';
import { ActivitesPublic } from './pages/public/ActivitesPublic';
import { PublicationsPublic } from './pages/public/PublicationsPublic';
import { AdhesionForm } from './pages/public/AdhesionForm';
import { Login } from './pages/public/Login';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { ResetPassword } from './pages/public/ResetPassword';
import { ChangePassword } from './pages/public/ChangePassword';

// Member Core Pages
import { DashboardRouter } from './pages/member/DashboardRouter';
import { Annuaire } from './pages/member/Annuaire';
import { ProfilDetail } from './pages/member/ProfilDetail';
import { MonProfil } from './pages/member/MonProfil';
import { PublicationsList } from './pages/member/PublicationsList';
import { EvenementsList } from './pages/member/EvenementsList';
import { EvenementDetail } from './pages/member/EvenementDetail';
import { Calendrier } from './pages/member/Calendrier';
import { BibliothequeDocuments } from './pages/member/BibliothequeDocuments';
import { ReunionsList } from './pages/member/ReunionsList';
import { ReunionDetail } from './pages/member/ReunionDetail';
import { MaterielInventaire } from './pages/member/MaterielInventaire';
import { MesDemandesMateriel } from './pages/member/MesDemandesMateriel';
import { PartenairesConventions } from './pages/member/PartenairesConventions';
import { Messagerie } from './pages/member/Messagerie';
import { NotificationsList } from './pages/member/NotificationsList';
import { RechercheGlobale } from './pages/member/RechercheGlobale';

// Governance Pages
import { EvenementsAValider } from './pages/member/EvenementsAValider';
import { GestionDemandesAdhesion } from './pages/member/GestionDemandesAdhesion';
import { ValidationDemandesMateriel } from './pages/member/ValidationDemandesMateriel';
import { GestionEquipes } from './pages/member/GestionEquipes';
import { GestionMandats } from './pages/member/GestionMandats';
import { GestionDepartsRetraites } from './pages/member/GestionDepartsRetraites';
import { RapportAnnuel } from './pages/member/RapportAnnuel';

// Admin Pages
import { GestionComptes } from './pages/member/GestionComptes';
import { ParametrageLabo } from './pages/member/ParametrageLabo';
import { JournalAudit } from './pages/member/JournalAudit';
import { MaintenanceTechnique } from './pages/member/MaintenanceTechnique';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Layout Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/equipes" element={<EquipesPublic />} />
              <Route path="/equipes/:id" element={<EquipeDetail />} />
              <Route path="/activites" element={<ActivitesPublic />} />
              <Route path="/publications" element={<PublicationsPublic />} />
              <Route path="/adhesion" element={<AdhesionForm />} />
            </Route>

            {/* Auth Standalone Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            {/* Authenticated Member Portal */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route
                path="/membres"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_PERMANENT', 'ROLE_ASSOCIE', 'ADMIN']}>
                    <Annuaire />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/membres/:id"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_PERMANENT', 'ROLE_ASSOCIE', 'ADMIN']}>
                    <ProfilDetail />
                  </ProtectedRoute>
                }
              />
              <Route path="/profil" element={<MonProfil />} />

              {/* Research & Production */}
              <Route path="/publications-gestion" element={<PublicationsList />} />
              <Route
                path="/evenements"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_PERMANENT', 'ROLE_ASSOCIE', 'ADMIN']}>
                    <EvenementsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evenements/:id"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_PERMANENT', 'ROLE_ASSOCIE', 'ADMIN']}>
                    <EvenementDetail />
                  </ProtectedRoute>
                }
              />
              <Route path="/calendrier" element={<Calendrier />} />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_PERMANENT', 'ROLE_ASSOCIE', 'ADMIN']}>
                    <BibliothequeDocuments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reunions"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_PERMANENT', 'ROLE_ASSOCIE', 'ADMIN']}>
                    <ReunionsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reunions/:id"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_PERMANENT', 'ROLE_ASSOCIE', 'ADMIN']}>
                    <ReunionDetail />
                  </ProtectedRoute>
                }
              />

              {/* Logistics & Resources (Permanent and Admin only) */}
              <Route
                path="/materiel"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_PERMANENT', 'ADMIN']}>
                    <MaterielInventaire />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mes-demandes-materiel"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_PERMANENT', 'ADMIN']}>
                    <MesDemandesMateriel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/conventions"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_PERMANENT', 'ROLE_ASSOCIE', 'ADMIN']}>
                    <PartenairesConventions />
                  </ProtectedRoute>
                }
              />

              {/* Communication */}
              <Route
                path="/messagerie"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_PERMANENT', 'ROLE_ASSOCIE', 'ADMIN']}>
                    <Messagerie />
                  </ProtectedRoute>
                }
              />
              <Route path="/notifications" element={<NotificationsList />} />
              <Route path="/recherche" element={<RechercheGlobale />} />

              {/* Governance & Direction (Directeur / Vice-Directeur / Chef d'Équipe / Admin) */}
              <Route
                path="/gouvernance/evenements"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_DIRECTEUR', 'ROLE_VICE_DIRECTEUR', 'ROLE_CHEF_EQUIPE', 'ROLE_ADMIN', 'ADMIN']}>
                    <EvenementsAValider />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gouvernance/adhesions"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_DIRECTEUR', 'ROLE_VICE_DIRECTEUR', 'ROLE_ADMIN', 'ADMIN']}>
                    <GestionDemandesAdhesion />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gouvernance/materiel"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_DIRECTEUR', 'ROLE_VICE_DIRECTEUR', 'ROLE_CHEF_EQUIPE', 'ROLE_ADMIN', 'ADMIN']}>
                    <ValidationDemandesMateriel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gouvernance/equipes"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_DIRECTEUR', 'ROLE_VICE_DIRECTEUR', 'ROLE_ADMIN', 'ADMIN']}>
                    <GestionEquipes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gouvernance/mandats"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_DIRECTEUR', 'ROLE_VICE_DIRECTEUR', 'ROLE_ADMIN', 'ADMIN']}>
                    <GestionMandats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gouvernance/departs"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_DIRECTEUR', 'ROLE_VICE_DIRECTEUR', 'ROLE_ADMIN', 'ADMIN']}>
                    <GestionDepartsRetraites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gouvernance/rapport-annuel"
                element={
                  <ProtectedRoute allowedAuthorities={['ROLE_DIRECTEUR', 'ROLE_VICE_DIRECTEUR', 'ROLE_ADMIN', 'ADMIN']}>
                    <RapportAnnuel />
                  </ProtectedRoute>
                }
              />

              {/* Administration */}
              <Route
                path="/admin/comptes"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <GestionComptes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/parametres"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ParametrageLabo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <JournalAudit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/maintenance"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <MaintenanceTechnique />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
