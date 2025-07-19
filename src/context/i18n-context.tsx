// src/context/i18n-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import en from '@/locales/en.json';
import pt from '@/locales/pt.json';

type Language = 'en' | 'pt';

interface Translations {
  [key: string]: string | Translations;
}

const translations: { [key in Language]: Translations } = {
  en,
  pt,
};

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Helper function to get nested keys
const getNestedValue = (obj: any, key: string): string => {
  return key.split('.').reduce((acc, part) => acc && acc[part], obj) || key;
};

export const TranslationsProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'pt'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    // Add a flag to indicate user has manually changed the language
    localStorage.setItem('language_manual_set', 'true');
  };

  const t = (key: string): string => {
    return getNestedValue(translations[language], key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationsProvider');
  }
  return context;
};
