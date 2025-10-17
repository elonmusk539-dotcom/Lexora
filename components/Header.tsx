'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { StreakDisplay } from './StreakDisplay';

interface UserProfile {
  username: string | null;
  avatar_url: string | null;
}

export function Header() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">
              Lexora
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            {/* Streak Display */}
            <StreakDisplay compact />
            
            {/* Profile Avatar and Username */}
            <Link href="/profile" className="relative group flex items-center gap-2">
              {profile?.username && (
                <span className="text-gray-700 dark:text-gray-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {profile.username}
                </span>
              )}
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || 'Profile'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-all cursor-pointer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-all cursor-pointer">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
