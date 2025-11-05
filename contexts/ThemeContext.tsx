'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
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
  const isDark = newTheme === 'dark';

  console.log('[applyThemeToDom] Theme:', newTheme, 'isDark:', isDark);
  console.log('[applyThemeToDom] BEFORE - root.classList:', root.classList.value);
  console.log('[applyThemeToDom] BEFORE - body.classList:', body?.classList.value);

  // Explicitly remove dark class from both root and body
  root.classList.remove('dark');
  body?.classList.remove('dark');
  
  // Add dark class only if theme is dark
  if (isDark) {
    root.classList.add('dark');
    body?.classList.add('dark');
  }

  root.setAttribute('data-theme', newTheme);
  root.setAttribute('data-mode', newTheme);

  root.style.colorScheme = newTheme;
  
  console.log('[applyThemeToDom] AFTER - root.classList:', root.classList.value);
  console.log('[applyThemeToDom] AFTER - body.classList:', body?.classList.value);
  
  // Force reflow to ensure CSS recalculation
  void root.offsetHeight;
  void body?.offsetHeight;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme());
  const [userId, setUserId] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const shouldPersistRef = useRef(true);

  type UpdateThemeOptions = {
    persist?: boolean;
  };

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

  const updateTheme = useCallback((newTheme: Theme, options: UpdateThemeOptions = {}) => {
    shouldPersistRef.current = options.persist ?? true;
    setThemeState((current) => (current === newTheme ? current : newTheme));
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    console.log('[Theme Effect] Applying theme:', theme, 'hasMounted:', hasMounted);
    applyThemeToDom(theme);

    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    if (!shouldPersistRef.current) {
      shouldPersistRef.current = true;
      return;
    }

    if (userId) {
      void saveThemeToDatabase(userId, theme);
    }
  }, [theme, hasMounted, userId, saveThemeToDatabase]);

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
            updateTheme(dbTheme, { persist: false });
            return;
          }
        }

        updateTheme(getPreferredTheme(), { persist: false });
      } catch (error) {
        console.error('Error initializing theme:', error);
        updateTheme(getPreferredTheme(), { persist: false });
      }
    };

    initializeTheme();
  }, [updateTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && isTheme(event.newValue)) {
        updateTheme(event.newValue, { persist: false });
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [updateTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    updateTheme(newTheme);
  }, [updateTheme]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('[Theme Toggle] Current theme:', theme, '→ New theme:', newTheme);
    updateTheme(newTheme);
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
