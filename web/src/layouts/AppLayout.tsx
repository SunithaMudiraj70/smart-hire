import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { AppNavbar } from '../components/layout/AppNavbar';
import { MarketPulse } from '../components/layout/MarketPulse';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';

export const AppLayout: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Check if candidate has completed onboarding
    const onboarded = localStorage.getItem('smart_hire_onboarded');
    if (!onboarded) {
      setShowOnboarding(true);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {isOffline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff size={14} />
          <span>You are offline. Showing cached jobs and application tracking.</span>
        </div>
      )}
      <AppNavbar />
      <MarketPulse />
      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* 3-Step Candidate Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
};

