import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { PageLoader } from '@/components/PageLoader';
import { useWedding } from '@/hooks/useWedding';

/** Sends first-time visitors to onboarding until a wedding has been created. */
export function RequireWedding({ children }: { children: ReactNode }) {
  const { wedding, isLoading } = useWedding();

  if (isLoading) return <PageLoader fullScreen />;
  if (!wedding) return <Navigate to="/welcome" replace />;

  return children;
}
