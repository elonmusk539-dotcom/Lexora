'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeTheme = async () => {
    try {
      // Get user first
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // If user is logged in, prioritize database theme
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('settings')
          .eq('user_id', user.id)
          .single();

        if (profile?.settings?.theme) {
          const dbTheme = profile.settings.theme as Theme;
          applyTheme(dbTheme);
          return;
        }
      }

      // Fallback to localStorage
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      
      if (savedTheme) {
        applyTheme(savedTheme);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Fallback to localStorage on error
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme) {
        applyTheme(savedTheme);
      }
    }
  };

  const applyTheme = (newTheme: Theme) => {
    console.log('Applying theme:', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('Added dark class to html');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class from html');
    }
    console.log('Current html classes:', document.documentElement.className);
  };

  const saveThemeToDatabase = async (newTheme: Theme) => {
    if (!userId) return;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('user_id', userId)
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
        .eq('user_id', userId);

      if (error) {
        console.error('Error saving theme:', error);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme);
    saveThemeToDatabase(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Toggle theme from', theme, 'to', newTheme);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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
