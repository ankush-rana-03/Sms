import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { parentAuthService, Parent } from '../services/parentAuthService';

interface ParentAuthContextType {
  parent: Parent | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateParent: (parentData: Partial<Parent>) => void;
}

const ParentAuthContext = createContext<ParentAuthContextType | undefined>(undefined);

export const useParentAuth = () => {
  const context = useContext(ParentAuthContext);
  if (context === undefined) {
    throw new Error('useParentAuth must be used within a ParentAuthProvider');
  }
  return context;
};

interface ParentAuthProviderProps {
  children: ReactNode;
}

export const ParentAuthProvider: React.FC<ParentAuthProviderProps> = ({ children }) => {
  const [parent, setParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const isLoggedIn = parentAuthService.isParentLoggedIn();
        
        if (isLoggedIn) {
          const parentData = parentAuthService.getParentData();
          if (parentData) {
            // Verify token is still valid
            try {
              await parentAuthService.getParentProfile();
              setParent(parentData);
              setIsLoggedIn(true);
            } catch (error) {
              console.log('Token validation failed, logging out');
              parentAuthService.logoutParent();
              setParent(null);
              setIsLoggedIn(false);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        parentAuthService.logoutParent();
        setParent(null);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await parentAuthService.loginParent({ email, password });
      
      if (response.success) {
        parentAuthService.setParentData(response.data.parent);
        setParent(response.data.parent);
        setIsLoggedIn(true);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    parentAuthService.logoutParent();
    setParent(null);
    setIsLoggedIn(false);
  };

  const updateParent = (parentData: Partial<Parent>) => {
    if (parent) {
      const updatedParent = { ...parent, ...parentData };
      setParent(updatedParent);
      parentAuthService.setParentData(updatedParent);
    }
  };

  const value: ParentAuthContextType = {
    parent,
    loading,
    isLoggedIn,
    login,
    logout,
    updateParent
  };

  return (
    <ParentAuthContext.Provider value={value}>
      {children}
    </ParentAuthContext.Provider>
  );
};