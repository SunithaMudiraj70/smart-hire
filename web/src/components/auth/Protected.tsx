import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedProps {
  children: React.ReactNode;
}

export const Protected: React.FC<ProtectedProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 dark:border-t-brand-dark animate-spin"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  return <>{children}</>;
};

