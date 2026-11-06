import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Search, Sparkles, Send, Bookmark, Briefcase, User as UserIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Logo } from '../brand/Logo';
import { NotificationDropdown } from './NotificationDropdown';
import { UserMenu } from './UserMenu';
import api from '../../lib/axios';

export const AppNavbar: React.FC = () => {
  // Query counts for badges
  const { data: appliedList = [] } = useQuery<any[]>({
    queryKey: ['applied-jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs/applied');
      return res.data;
    },
  });

  const { data: savedList = [] } = useQuery<any[]>({
    queryKey: ['saved-jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs/saved');
      return res.data;
    },
  });

  const desktopNavItems = [
    {
      to: '/app/search',
      label: 'Find Jobs',
      icon: Search,
    },
    {
      to: '/app/recommended',
      label: 'Recommended',
      badge: 'CV Matched',
      icon: Sparkles,
      badgeColor: 'bg-indigo-100 text-brand-700 dark:bg-indigo-950/80 dark:text-brand-300',
    },
    {
      to: '/app/applied',
      label: 'Applied',
      count: appliedList.length,
      icon: Send,
    },
    {
      to: '/app/saved',
      label: 'Saved',
      count: savedList.length,
      icon: Bookmark,
    },
  ];

  const mobileNavTabs = [
    {
      to: '/app/search',
      label: 'Find',
      icon: Search,
    },
    {
      to: '/app/recommended',
      label: 'Recommended',
      icon: Sparkles,
    },
    {
      to: '/app/applied',
      label: 'Applied',
      count: appliedList.length,
      icon: Send,
    },
    {
      to: '/app/saved',
      label: 'Saved',
      count: savedList.length,
      icon: Bookmark,
    },
    {
      to: '/app/settings',
      label: 'Profile',
      icon: UserIcon,
    },
  ];

  return (
    <>
      {/* Top Sticky Desktop & Tablet Navbar */}
      <nav className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo size="md" linkTo="/app/search" />

            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center gap-1.5">
              {desktopNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-dark'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.count}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right Action Icons: Notifications & User Avatar */}
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Bottom Sticky Mobile Navbar (< 768px): Find, Recommended, Applied, Saved, Profile */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex justify-around items-center shadow-lg"
      >
        {mobileNavTabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-semibold transition ${
                isActive
                  ? 'text-brand-600 dark:text-brand-dark'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

