import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BASE_URL } from '../utils/constants.js';

export type Role = 'Worker' | 'Admin' | 'Volunteer';

export interface User {
  _id?: string; // Added to match your MongoDB output
  name: string;
  email: string;
  role: Role;
  adminKey?: string;
  skills?: string[] | string;
  location?: any;
  isAvailable?: boolean;
  category?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. Silent Login / Session Verification on Load ---
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Credentials': 'include', 
          },
          // This ensures cookies are sent along with the request as you requested
          credentials: 'include', 
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Token is valid, sync the user state with fresh data from DB
          setUser(result.data);
          localStorage.setItem('user', JSON.stringify(result.data));
        } else {
          // Token is invalid or expired
          handleLocalLogout();
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        // On network error, we keep the localStorage user as a fallback 
        // so the app doesn't crash offline.
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLocalLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Clear cookies by setting expiry to past
    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const logout = () => {
    handleLocalLogout();
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};