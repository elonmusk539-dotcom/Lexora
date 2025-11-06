'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, PlayCircle, User, Settings, List, Brain, HelpCircle, Menu, X } from 'lucide-react';
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
    if (mobileOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={toggleMobileMenu}
          className="md:hidden fixed inset-0 bg-black/50 z-[80] overflow-hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isMobile ? '240px' : (collapsed ? '80px' : '240px'),
        }}
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-[90] transition-transform duration-300 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Upgrade Button & Toggle */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0 md:mt-0 mt-16">
          {(!collapsed || isMobile) && (
            <Link href="/premium" onClick={() => setMobileOpen(false)}>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm whitespace-nowrap">
                Upgrade
              </button>
            </Link>
          )}
          
          {/* Desktop collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden md:block ${collapsed ? '' : 'ml-auto'}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          
          {/* Mobile close button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden ml-auto p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors relative ${
                  collapsed ? 'justify-center aspect-square' : 'justify-start'
                } ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
                {item.badge && item.badge > 0 && (!collapsed || isMobile) && (
                  <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded-full ${
                    active 
                      ? 'bg-white text-purple-600' 
                      : 'bg-red-500 text-white'
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
        className="flex-1 transition-all duration-300 ml-0 md:ml-20 lg:ml-60"
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
