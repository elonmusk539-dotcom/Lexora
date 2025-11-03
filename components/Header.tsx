'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, User, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { StreakDisplay } from './StreakDisplay';

interface UserProfile {
  username: string | null;
  avatar_url: string | null;
}

interface HeaderProps {
  onMenuToggle?: () => void;
  menuOpen?: boolean;
}

export function Header({ onMenuToggle, menuOpen }: HeaderProps = {}) {
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
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-[70]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="md:hidden p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center"
                aria-label="Toggle menu"
                style={{ width: '40px', height: '40px' }}
              >
                {menuOpen ? (
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            )}
            
            <Link href="/" className="md:pl-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">
                Lexora
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            {/* Streak Display */}
            <StreakDisplay compact />
            
            {/* Profile Avatar and Username */}
            <Link href="/profile" className="relative group flex items-center gap-1 sm:gap-2">
              {profile?.username && (
                <span className="hidden sm:block text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {profile.username}
                </span>
              )}
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username || 'Profile'}
                  width={44}
                  height={44}
                  className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-all cursor-pointer"
                  sizes="(max-width: 768px) 40px, 44px"
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-all cursor-pointer">
                  <User className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                </div>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
