import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../brand/Logo';
import { Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 text-sm">
          {/* Brand & Tagline */}
          <div className="flex flex-col items-center md:items-start gap-2 max-w-sm text-center md:text-left">
            <Logo size="sm" showTagline={false} />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
              Find the right job without scrolling every portal.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Built for freshers, early-career and working professionals across India.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-medium text-slate-600 dark:text-slate-400">
            <div className="flex flex-col gap-2">
              <span className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-[11px]">
                Product
              </span>
              <Link to="/app/search" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
                Find Jobs
              </Link>
              <Link to="/app/recommended" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
                Recommended
              </Link>
              <Link to="/app/applied" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
                Application Tracker
              </Link>
              <a href="/#pricing" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
                Pricing
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-[11px]">
                Company
              </span>
              <a href="/#for-companies" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
                For Employers
              </a>
              <a href="/#faq" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
                FAQ
              </a>
              <a href="mailto:support@smart-hire.app" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
                Contact Support
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-[11px]">
                Legal
              </span>
              <a href="#privacy" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
                Terms of Service
              </a>
              <a href="#compliance" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
                ATS Compliance
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Shield size={13} className="text-emerald-500" />
              100% Verified ATS Feeds
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Sparkles size={13} className="text-brand-500" />
              Real-Time Health Engine
            </span>
          </div>

          <div>
            &copy; {new Date().getFullYear()} smart-hire. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

