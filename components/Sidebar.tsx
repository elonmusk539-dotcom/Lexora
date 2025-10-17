'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, PlayCircle, User, Settings, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setCollapsed(savedState === 'true');
    }
  }, []);

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
    { href: '/quiz', label: 'Quiz', icon: PlayCircle },
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
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? '80px' : '240px' }}
        className="fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 flex flex-col"
      >
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {!collapsed && (
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">
                Lexora
              </h1>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
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
                className={`flex items-center justify-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  collapsed ? 'aspect-square' : ''
                } ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: collapsed ? '80px' : '240px' }}
      >
        {children}
      </div>

      {/* Mobile Overlay */}
      <style jsx global>{`
        @media (max-width: 768px) {
          aside {
            transform: translateX(-100%);
          }
          aside.mobile-open {
            transform: translateX(0);
          }
          .flex-1 {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
