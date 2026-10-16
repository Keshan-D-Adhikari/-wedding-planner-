import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router';
import { PageLoader } from '@/components/PageLoader';
import { AppLayout } from './layout/AppLayout';
import { RequireWedding } from './RequireWedding';

// Each feature is code-split into its own chunk and only downloaded when visited.
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const ChecklistPage = lazy(() => import('@/features/checklist/ChecklistPage'));
const BudgetPage = lazy(() => import('@/features/budget/BudgetPage'));
const GuestsPage = lazy(() => import('@/features/guests/GuestsPage'));
const SeatingPage = lazy(() => import('@/features/seating/SeatingPage'));
const ExportPage = lazy(() => import('@/features/export/ExportPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const OnboardingPage = lazy(() => import('@/features/onboarding/OnboardingPage'));
const NotFoundPage = lazy(() => import('./NotFoundPage'));

function Page({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Onboarding is full-screen, without navigation */}
      <Route
        path="/welcome"
        element={
          <Page>
            <OnboardingPage />
          </Page>
        }
      />

      {/* Everything else needs a wedding; first-time visitors go to onboarding */}
      <Route
        element={
          <RequireWedding>
            <AppLayout />
          </RequireWedding>
        }
      >
        <Route
          index
          element={
            <Page>
              <DashboardPage />
            </Page>
          }
        />
        <Route
          path="checklist"
          element={
            <Page>
              <ChecklistPage />
            </Page>
          }
        />
        <Route
          path="budget"
          element={
            <Page>
              <BudgetPage />
            </Page>
          }
        />
        <Route
          path="guests"
          element={
            <Page>
              <GuestsPage />
            </Page>
          }
        />
        <Route
          path="seating"
          element={
            <Page>
              <SeatingPage />
            </Page>
          }
        />
        <Route
          path="export"
          element={
            <Page>
              <ExportPage />
            </Page>
          }
        />
        <Route
          path="settings"
          element={
            <Page>
              <SettingsPage />
            </Page>
          }
        />
        <Route
          path="*"
          element={
            <Page>
              <NotFoundPage />
            </Page>
          }
        />
      </Route>
    </Routes>
  );
}
