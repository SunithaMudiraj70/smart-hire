import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Sparkles, Send, Bookmark, User } from 'lucide-react';

export const MobileTabBar: React.FC = () => {
  const tabs = [
    { label: 'Find', to: '/app/search', icon: Search },
    { label: 'Recommended', to: '/app/recommended', icon: Sparkles },
    { label: 'Applied', to: '/app/applied', icon: Send },
    { label: 'Saved', to: '/app/saved', icon: Bookmark },
    { label: 'Profile', to: '/app/settings', icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around shadow-lg select-none"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition text-[11px] font-semibold ${
                isActive
                  ? 'text-brand-600 dark:text-brand-dark'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-dark" />
                  )}
                </div>
                <span className="mt-1 leading-none">{tab.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

