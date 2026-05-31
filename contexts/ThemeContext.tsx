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
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (isTheme(stored)) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDom = (newTheme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;
  const isDark = newTheme === 'dark';
  root.classList.remove('dark');
  body?.classList.remove('dark');
  if (isDark) {
    root.classList.add('dark');
    body?.classList.add('dark');
  }
  root.setAttribute('data-theme', newTheme);
  root.setAttribute('data-mode', newTheme);
  root.style.colorScheme = newTheme;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme());
  const [hasMounted, setHasMounted] = useState(false);
  const shouldPersistRef = useRef(true);

  type UpdateThemeOptions = { persist?: boolean };

  const saveThemeToDatabase = useCallback(async (userId: string, newTheme: Theme) => {
    try {
      await supabase
        .from('user_profiles')
        .update({
          settings: { theme: newTheme },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } catch {
      // Silently fail — theme is already saved to localStorage
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
    if (!hasMounted) return;
    applyThemeToDom(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    if (!shouldPersistRef.current) {
      shouldPersistRef.current = true;
      return;
    }
    // Persist to DB in the background — no auth call needed, RLS handles it
    const persistTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) void saveThemeToDatabase(user.id, theme);
    };
    void persistTheme();
  }, [theme, hasMounted, saveThemeToDatabase]);

  // Load theme from DB on mount
  useEffect(() => {
    const loadThemeFromDb = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('settings')
          .eq('user_id', user.id)
          .single();
        const dbTheme = profile?.settings?.theme;
        if (isTheme(dbTheme)) updateTheme(dbTheme, { persist: false });
      } catch {
        // Keep localStorage theme on error
      }
    };
    loadThemeFromDb();
  }, [updateTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && isTheme(event.newValue)) {
        updateTheme(event.newValue, { persist: false });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [updateTheme]);

  const setTheme = useCallback((newTheme: Theme) => updateTheme(newTheme), [updateTheme]);
  const toggleTheme = useCallback(() => {
    updateTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, updateTheme]);

  const contextValue = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
