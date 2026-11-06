import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SearchPage } from './pages/app/SearchPage';
import { RecommendedPage } from './pages/app/RecommendedPage';
import { AppliedTrackerPage } from './pages/app/AppliedTrackerPage';
import { SavedJobsPage } from './pages/app/SavedJobsPage';
import { SettingsPage } from './pages/app/SettingsPage';
import { RecruiterWorkspace } from './pages/app/RecruiterWorkspace';
import { Protected } from './components/auth/Protected';
import { PublicOnly } from './components/auth/PublicOnly';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/common/ToastContainer';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastContainer />
      <Routes>
        {/* Public Pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Auth Pages (Redirect to /app if already logged in) */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <SignupPage />
            </PublicOnly>
          }
        />

        {/* Protected App Routes (Redirect to /login with returnUrl if unauthenticated) */}
        <Route
          path="/app"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<Navigate to="/app/search" replace />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="recommended" element={<RecommendedPage />} />
          <Route path="applied" element={<AppliedTrackerPage />} />
          <Route path="saved" element={<SavedJobsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="recruiter" element={<RecruiterWorkspace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};
