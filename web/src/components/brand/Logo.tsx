import React from 'react';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  showTagline = false,
  size = 'md',
  linkTo = '/',
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 26,
  };

  const content = (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-1.5 font-extrabold tracking-tight select-none">
        <div className="flex items-center justify-center p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-dark shadow-sm">
          <Sparkles size={iconSizes[size]} className="animate-pulse" />
        </div>
        <span className={`${sizeClasses[size]} text-slate-900 dark:text-white font-extrabold`}>
          smart<span className="text-brand-600 dark:text-brand-dark">-hire</span>
        </span>
      </div>
      {showTagline && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
          Find the right job without scrolling every portal.
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};

