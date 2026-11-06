import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PublicOnlyProps {
  children: React.ReactNode;
}

export const PublicOnly: React.FC<PublicOnlyProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 rounded-full border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 dark:border-t-brand-dark animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    const returnUrl = searchParams.get('returnUrl');
    return <Navigate to={returnUrl || '/app/search'} replace />;
  }

  return <>{children}</>;
};

