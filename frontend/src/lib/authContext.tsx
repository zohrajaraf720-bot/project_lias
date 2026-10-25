import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';
import { MeDTO, AuthResponse } from '../types';

interface AuthContextType {
  user: MeDTO | null;
  loading: boolean;
  token: string | null;
  login: (credentials: { email: string; motDePasse: string }) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDirecteur: boolean;
  isViceDirecteur: boolean;
  isDirection: boolean;
  canManageMandats: boolean;
  canPublish: boolean;
  isChefEquipe: boolean;
  isDoctorant: boolean;
  isAssocie: boolean;
  isPermanent: boolean;
  hasRole: (role: string) => boolean;
  hasAuthority: (authority: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MeDTO | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get<MeDTO>('/auth/me');
      setUser(response.data);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials: { email: string; motDePasse: string }): Promise<AuthResponse> => {
    let response;
    try {
      response = await api.post<AuthResponse>('/auth/connexion', credentials);
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.data?.message?.includes('No static resource')) {
        response = await api.post<AuthResponse>('/auth/login', credentials);
      } else {
        throw err;
      }
    }
    const data = response.data;
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setToken(data.accessToken);

    let userObj = data.utilisateur || (data as any).membre;
    try {
      const meRes = await api.get<MeDTO>('/auth/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      if (meRes.data) {
        userObj = meRes.data;
      }
    } catch {
      // Keep userObj if me call fails
    }

    setUser(userObj);
    return {
      ...data,
      utilisateur: userObj,
    };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const authorities = user?.authorities || (user as any)?.autorites || [];
  const isAdmin = user?.roleSysteme === 'ADMIN' || authorities.includes('ROLE_ADMIN');

  const hasRole = (role: string) => {
    if (user?.roleSysteme === role) return true;
    if (user?.statut === role) return true;
    if (authorities.includes(role)) return true;
    return authorities.includes(`ROLE_${role}`);
  };

  const hasAuthority = (authority: string) => {
    if (authorities.includes(authority)) return true;
    if (authority.startsWith('ROLE_')) {
      const stripped = authority.substring(5);
      if (user?.statut === stripped) return true;
      if (user?.roleSysteme === stripped) return true;
      return authorities.includes(authority);
    }
    return authorities.includes(`ROLE_${authority}`) || user?.statut === authority || user?.roleSysteme === authority;
  };

  const isDirecteur = authorities.includes('ROLE_DIRECTEUR');
  const isViceDirecteur = authorities.includes('ROLE_VICE_DIRECTEUR');
  const isChefEquipe = authorities.includes('ROLE_CHEF_EQUIPE');
  const isDoctorant = user?.statut === 'DOCTORANT';
  const isAssocie = user?.statut === 'ASSOCIE';
  const isPermanent = user?.statut === 'PERMANENT';

  const isDirection = isDirecteur || isViceDirecteur || isAdmin;
  const canManageMandats = isDirecteur || isAdmin;
  const canPublish = !isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        logout,
        refreshUser: fetchCurrentUser,
        isAuthenticated: !!user,
        isAdmin,
        isDirecteur,
        isViceDirecteur,
        isDirection,
        canManageMandats,
        canPublish,
        isChefEquipe,
        isDoctorant,
        isAssocie,
        isPermanent,
        hasRole,
        hasAuthority,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
