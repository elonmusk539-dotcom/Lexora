'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme';

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (isTheme(stored)) {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDom = (newTheme: Theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const body = document.body;

  root.classList.toggle('dark', newTheme === 'dark');
  root.setAttribute('data-theme', newTheme);

  if (body) {
    body.setAttribute('data-theme', newTheme);
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme());
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingDbTheme, setPendingDbTheme] = useState<Theme | null>(null);

  const saveThemeToDatabase = useCallback(async (userIdValue: string, newTheme: Theme) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('user_id', userIdValue)
        .single();

      const currentSettings = profile?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        theme: newTheme,
      };

      const { error } = await supabase
        .from('user_profiles')
        .update({
          settings: updatedSettings as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userIdValue);

      if (error) {
        console.error('Error saving theme:', error);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  const updateTheme = useCallback((newTheme: Theme, persist = true) => {
    setThemeState(newTheme);
    applyThemeToDom(newTheme);

    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }

    if (!persist) {
      return;
    }

    if (userId) {
      void saveThemeToDatabase(userId, newTheme);
    } else {
      setPendingDbTheme(newTheme);
    }
  }, [userId, saveThemeToDatabase]);

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);

          const { data: profile } = await supabase
            .from('user_profiles')
            .select('settings')
            .eq('user_id', user.id)
            .single();

          const dbTheme = profile?.settings?.theme;
          if (isTheme(dbTheme)) {
            updateTheme(dbTheme, false);
            return;
          }
        }

        updateTheme(getPreferredTheme(), false);
      } catch (error) {
        console.error('Error initializing theme:', error);
        updateTheme(getPreferredTheme(), false);
      }
    };

    initializeTheme();
  }, [updateTheme]);

  useEffect(() => {
    if (!userId || !pendingDbTheme) {
      return;
    }

    void saveThemeToDatabase(userId, pendingDbTheme);
    setPendingDbTheme(null);
  }, [userId, pendingDbTheme, saveThemeToDatabase]);

  const setTheme = useCallback((newTheme: Theme) => {
    updateTheme(newTheme);
  }, [updateTheme]);

  const toggleTheme = useCallback(() => {
    updateTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, updateTheme]);

  const contextValue = useMemo(() => ({
    theme,
    toggleTheme,
    setTheme,
  }), [theme, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
