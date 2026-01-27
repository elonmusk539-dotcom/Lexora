'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, PlayCircle, User, Settings, List, Brain, HelpCircle, Menu, X, MessageSquare, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { Header } from './Header';

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const scrollPositionRef = useRef(0);
  const previousStylesRef = useRef<{
    bodyOverflow: string;
    bodyPosition: string;
    bodyTop: string;
    bodyWidth: string;
    htmlOverflow: string;
  } | null>(null);
  const pathname = usePathname();

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    const html = document.documentElement;

    if (mobileOpen && isMobile) {
      previousStylesRef.current = {
        bodyOverflow: document.body.style.overflow,
        bodyPosition: document.body.style.position,
        bodyTop: document.body.style.top,
        bodyWidth: document.body.style.width,
        htmlOverflow: html.style.overflow,
      };

      scrollPositionRef.current = window.scrollY;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
      html.style.overflow = 'hidden';

      return () => {
        if (previousStylesRef.current) {
          const { bodyOverflow, bodyPosition, bodyTop, bodyWidth, htmlOverflow } = previousStylesRef.current;
          document.body.style.overflow = bodyOverflow;
          document.body.style.position = bodyPosition;
          document.body.style.top = bodyTop;
          document.body.style.width = bodyWidth;
          html.style.overflow = htmlOverflow;
          window.scrollTo(0, scrollPositionRef.current);
          previousStylesRef.current = null;
        }
      };
    }

    if (previousStylesRef.current) {
      const { bodyOverflow, bodyPosition, bodyTop, bodyWidth, htmlOverflow } = previousStylesRef.current;
      document.body.style.overflow = bodyOverflow;
      document.body.style.position = bodyPosition;
      document.body.style.top = bodyTop;
      document.body.style.width = bodyWidth;
      html.style.overflow = htmlOverflow;
      window.scrollTo(0, scrollPositionRef.current);
      previousStylesRef.current = null;
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      html.style.overflow = '';
    }
  }, [mobileOpen, isMobile]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setCollapsed(savedState === 'true');
    }

    // Load due words count
    loadDueCount();

    // Refresh count every 5 minutes
    const interval = setInterval(loadDueCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const loadDueCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: count } = await supabase.rpc('get_due_words_count', {
        p_user_id: user.id,
      });

      if (count !== null) {
        setDueCount(count);
      }
    } catch (error) {
      console.error('Error loading due count:', error);
    }
  };

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/lists', label: 'Lists', icon: BookOpen },
    { href: '/my-lists', label: 'My Lists', icon: List },
    { href: '/review/setup', label: 'Smart Quiz', icon: Brain, badge: dueCount > 0 ? dueCount : undefined },
    { href: '/quiz', label: 'Normal Quiz', icon: PlayCircle },
    { href: '/faq', label: 'FAQ', icon: HelpCircle },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/feedback', label: 'Feedback', icon: MessageSquare },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Don't show sidebar on login/signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-mesh">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleMobileMenu}
          className="md:hidden fixed inset-0 bg-night-400/60 backdrop-blur-sm z-[80] overflow-hidden"
          style={{ touchAction: 'none' }}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? '260px' : (collapsed ? '80px' : '260px'),
        }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed left-0 top-0 h-full glass-strong z-[90] transition-transform duration-300 overflow-y-auto overscroll-contain ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Upgrade Button & Toggle */}
        <div
          className="px-3 pt-4 pb-4 border-b border-[var(--color-border)] space-y-2 flex-shrink-0"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          {(!collapsed || isMobile) ? (
            <div className="flex items-center gap-2">
              <Link href="/premium" onClick={() => setMobileOpen(false)} className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 px-4 bg-gradient-to-r from-coral-500 to-coral-400 text-white font-semibold rounded-xl shadow-glow-coral hover:shadow-lg transition-all text-base whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade
                </motion.button>
              </Link>

              {/* Desktop collapse toggle */}
              <button
                onClick={toggleCollapsed}
                className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl glass hover:bg-[var(--color-surface-overlay)] transition-all"
                aria-label="Collapse sidebar"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>

              {/* Mobile close button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden flex items-center justify-center w-12 h-12 rounded-xl glass hover:bg-[var(--color-surface-overlay)] transition-all"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
          ) : (
            <button
              onClick={toggleCollapsed}
              className="w-full flex items-center justify-center h-12 rounded-xl glass hover:bg-[var(--color-surface-overlay)] transition-all"
              aria-label="Expand sidebar"
            >
              <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 py-3 rounded-xl transition-all relative group ${collapsed ? 'justify-center px-0 h-12' : 'justify-start px-4'
                  } ${active
                    ? 'bg-gradient-to-r from-ocean-600 to-ocean-500 text-white shadow-glow'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]'
                  }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${active ? '' : 'group-hover:scale-110'}`} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
                {item.badge && item.badge > 0 && (!collapsed || isMobile) && (
                  <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded-full ${active
                    ? 'bg-white/20 text-white'
                    : 'bg-coral-500 text-white shadow-glow-coral'
                    }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ml-0 md:ml-20 ${collapsed ? '' : 'lg:ml-[260px]'}`}
      >
        {/* Don't show Header on login/signup/smart-quiz pages (smart quiz only on mobile) */}
        {pathname !== '/login' && pathname !== '/signup' && (
          <div className={pathname === '/review' ? 'hidden sm:block' : ''}>
            <Header onMenuToggle={toggleMobileMenu} menuOpen={mobileOpen} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
