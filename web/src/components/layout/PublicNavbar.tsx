import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../brand/Logo';
import { ArrowRight, LogIn } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo size="md" linkTo="/" />

        {/* Anchors Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
            How it works
          </a>
          <a href="#pricing" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
            Pricing
          </a>
          <a href="#faq" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
            FAQ
          </a>
          <a href="#sources" className="hover:text-brand-600 dark:hover:text-brand-dark transition">
            Direct Sources
          </a>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-dark transition"
          >
            <LogIn size={16} />
            <span>Log in</span>
          </Link>

          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-xs hover:shadow transition active:scale-[0.98]"
          >
            <span>Sign up free</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
};

