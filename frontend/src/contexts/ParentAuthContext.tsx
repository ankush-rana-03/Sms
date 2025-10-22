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
        console.log('Initializing parent authentication...');
        const isLoggedIn = parentAuthService.isParentLoggedIn();
        console.log('Parent logged in:', isLoggedIn);
        
        if (isLoggedIn) {
          const parentData = parentAuthService.getParentData();
          console.log('Parent data found:', parentData);
          if (parentData) {
            // Verify token is still valid by making a test API call
            try {
              await parentAuthService.getParentProfile();
              setParent(parentData);
              setIsLoggedIn(true);
            } catch (error) {
              console.log('Token validation failed, logging out:', error);
              parentAuthService.logoutParent();
              setIsLoggedIn(false);
            }
          } else {
            console.log('No parent data found, logging out');
            parentAuthService.logoutParent();
            setIsLoggedIn(false);
          }
        } else {
          console.log('Parent not logged in');
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Parent auth initialization error:', error);
        parentAuthService.logoutParent();
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await parentAuthService.loginParent({ email, password });
      
      // Store parent token and data
      localStorage.setItem('parentToken', response.token);
      localStorage.setItem('parentData', JSON.stringify(response.data.parent));
      
      setParent(response.data.parent);
      setIsLoggedIn(true);
    } catch (error) {
      throw error;
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
      localStorage.setItem('parentData', JSON.stringify(updatedParent));
    }
  };

  const value = {
    parent,
    loading,
    isLoggedIn,
    login,
    logout,
    updateParent,
  };

  return <ParentAuthContext.Provider value={value}>{children}</ParentAuthContext.Provider>;
};