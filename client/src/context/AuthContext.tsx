import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, RoleName } from '../types';
import { INITIAL_USERS } from '../services/mockData';
import { pharmacyStore } from '../services/pharmacyStore';

interface AuthContextType {
  user: User;
  switchRole: (role: RoleName) => void;
  switchUser: (userId: string) => void;
  availableUsers: User[];
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => pharmacyStore.currentUser || INITIAL_USERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    pharmacyStore.setCurrentUser(user);
  }, [user]);

  const switchRole = (role: RoleName) => {
    const foundUser = INITIAL_USERS.find((u) => u.role === role) || {
      ...user,
      role,
      roles: [role],
    };
    setUser(foundUser);
  };

  const switchUser = (userId: string) => {
    const found = INITIAL_USERS.find((u) => u.id === userId);
    if (found) {
      setUser(found);
    }
  };

  const login = async (email: string) => {
    const found = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: 'PHARMACY_MANAGER' as RoleName,
      roles: ['PHARMACY_MANAGER'],
      avatar: email.slice(0, 2).toUpperCase(),
    };
    setUser(found);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        switchRole,
        switchUser,
        availableUsers: INITIAL_USERS,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
