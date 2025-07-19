
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { useTheme } from 'next-themes';
import { useTranslation } from './i18n-context';

interface UserProfile {
  theme?: 'light' | 'dark' | 'system';
  language?: 'en' | 'pt';
  lastLoginAt?: {
    seconds: number;
    nanoseconds: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { setTheme } = useTheme();
  const { setLanguage } = useTranslation();
  const profileUnsubscribe = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Clean up previous profile listener if it exists
      if (profileUnsubscribe.current) {
        profileUnsubscribe.current();
        profileUnsubscribe.current = null;
      }

      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult(true); 
        setIsAdmin(!!idTokenResult.claims.admin);

        if (db) {
            const userDocRef = doc(db, "users", currentUser.uid);
            profileUnsubscribe.current = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data() as UserProfile;
                    if (data.theme) setTheme(data.theme);
                    const userHasManuallySetLang = localStorage.getItem('language_manual_set') === 'true';
                    if (data.language && !userHasManuallySetLang) {
                        setLanguage(data.language);
                    }
                }
            });
        }
      } else {
        setIsAdmin(false);
        setTheme('dark');
        localStorage.removeItem('language_manual_set');
        setLanguage('en');
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe.current) {
        profileUnsubscribe.current();
      }
    };
  }, [setTheme, setLanguage]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
