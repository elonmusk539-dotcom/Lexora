'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, User, Menu, X, Crown, Waves } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { StreakDisplay } from './StreakDisplay';
import { useSubscription } from '@/lib/subscription/useSubscription';

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
  const { isPro } = useSubscription();

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
    <header className="glass-strong border-b border-[var(--color-border)] sticky top-0 z-[70]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="md:hidden p-2 glass rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Toggle menu"
                style={{ width: '40px', height: '40px' }}
              >
                {menuOpen ? (
                  <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                ) : (
                  <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
                )}
              </button>
            )}

            <Link href="/" className="md:pl-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-600 shadow-glow flex items-center justify-center">
                  <Waves className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text cursor-pointer leading-none">
                  Lexora
                </h1>
                {isPro && (
                  <div className="badge badge-pro flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span className="text-[10px] sm:text-xs">PRO</span>
                  </div>
                )}
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
            {/* Streak Display */}
            <StreakDisplay compact />

            {/* Profile Avatar and Username */}
            <Link href="/profile" className="relative group flex items-center gap-2 sm:gap-3">
              {profile?.username && (
                <span className="hidden sm:block text-sm md:text-base text-[var(--color-text-secondary)] font-medium transition-colors">
                  {profile.username}
                </span>
              )}
              <div className="relative">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username || 'Profile'}
                    width={44}
                    height={44}
                    className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl object-cover ring-2 ring-[var(--color-border)] transition-all"
                    sizes="(max-width: 768px) 40px, 44px"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center ring-2 ring-[var(--color-border)] transition-all">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 sm:p-2.5 rounded-xl glass text-[var(--color-text-muted)] active:scale-95 transition-all"
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
