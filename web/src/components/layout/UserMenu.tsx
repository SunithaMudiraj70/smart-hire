import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Settings, FileText, Sun, Moon, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, profile, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();

  // Get initials from user name
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else setTheme('dark');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Profile Menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-brand-500/30 transition focus:outline-none"
      >
        <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
          {getInitials(user?.name)}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* User info */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {user?.name || 'Candidate'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.email}
            </p>
            {profile?.headline && (
              <p className="text-[11px] font-medium text-brand-600 dark:text-brand-400 mt-1 truncate">
                {profile.headline}
              </p>
            )}
          </div>

          <div className="p-1 text-sm text-slate-700 dark:text-slate-300">
            <Link
              to="/app/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Settings size={16} className="text-slate-500" />
              <span>Settings</span>
            </Link>

            <Link
              to="/app/settings?tab=profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <FileText size={16} className="text-slate-500" />
              <span>Resume & profile</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? <Moon size={16} className="text-brand-400" /> : <Sun size={16} className="text-amber-500" />}
                <span>Theme</span>
              </div>
              <span className="text-xs capitalize font-medium text-slate-400">
                {theme}
              </span>
            </button>
          </div>

          <div className="p-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-sm font-medium transition"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

