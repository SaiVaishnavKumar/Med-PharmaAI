import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, RoleName } from '../types';
import { INITIAL_USERS } from '../services/mockData';
import { pharmacyStore } from '../services/pharmacyStore';

interface AuthContextType {
  user: User;
  switchRole: (role: RoleName) => void;
  switchUser: (userId: string) => Promise<void>;
  availableUsers: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'mediflow_auth_session';
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
const DEMO_PASSWORD = 'DemoOnly!2026';
const AuthContext = createContext<AuthContextType | null>(null);

function toUser(value: any): User {
  const roles: string[] = Array.isArray(value.roles) ? value.roles.map((role: any) => typeof role === 'string' ? role : role.name) : [];
  const role = (roles[0] ?? 'PHARMACY_MANAGER') as RoleName;
  return { id: value.id, name: value.name, email: value.email, role, roles, avatar: value.avatar ?? value.name.slice(0, 2).toUpperCase() };
}

function saveSession(user: User) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    try { const saved = localStorage.getItem(AUTH_STORAGE_KEY); return saved ? JSON.parse(saved) as User : INITIAL_USERS[0]; }
    catch { return INITIAL_USERS[0]; }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try { return Boolean(localStorage.getItem(AUTH_STORAGE_KEY)); } catch { return false; }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        if (response.ok) {
          const body = await response.json();
          const restored = toUser(body.data);
          if (active) { setUser(restored); setIsAuthenticated(true); saveSession(restored); }
        } else if (response.status === 401 && active) {
          setIsAuthenticated(false); localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch { /* Offline demo sessions are stored locally. */ }
      finally { if (active) setIsLoading(false); }
    };
    void restore();
    return () => { active = false; };
  }, []);

  useEffect(() => { if (isAuthenticated) pharmacyStore.setCurrentUser(user); }, [user, isAuthenticated]);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) throw new Error('Enter your email and password.');
    let response: Response | undefined;
    try {
      response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
    } catch { /* The local demo can run without the API. */ }

    let authenticated: User;
    if (response?.ok) {
      const body = await response.json();
      authenticated = toUser(body.data.user);
    } else if (response) {
      if (response.status !== 401 && response.status !== 400) throw new Error('Sign-in service is unavailable. Please try again.');
      let message = 'Email or password is incorrect.';
      try { message = (await response.json()).error?.message ?? message; } catch {}
      throw new Error(message);
    } else {
      const demoUser = INITIAL_USERS.find((entry) => entry.email.toLowerCase() === normalizedEmail);
      if (!demoUser || password !== DEMO_PASSWORD) throw new Error('Demo sign-in uses a listed demo email and password DemoOnly!2026.');
      authenticated = demoUser;
    }

    setUser(authenticated); setIsAuthenticated(true); saveSession(authenticated);
  };

  const switchUser = async (userId: string) => {
    const demoUser = INITIAL_USERS.find((entry) => entry.id === userId);
    if (!demoUser) throw new Error('Demo profile not found.');
    await login(demoUser.email, DEMO_PASSWORD);
  };

  const switchRole = (role: RoleName) => {
    const foundUser = INITIAL_USERS.find((entry) => entry.role === role);
    if (foundUser) { setUser(foundUser); saveSession(foundUser); }
    else { const changed = { ...user, role, roles: [role] }; setUser(changed); saveSession(changed); }
  };

  const logout = async () => {
    try { await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }); } catch { /* Clear local session even while offline. */ }
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    pharmacyStore.setCurrentUser(INITIAL_USERS[0]);
  };

  return <AuthContext.Provider value={{ user, switchRole, switchUser, availableUsers: INITIAL_USERS, isAuthenticated, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
