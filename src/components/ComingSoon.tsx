import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { PageHeader } from './PageHeader';

interface ComingSoonProps {
  title: string;
  subtitle: string;
  phase: number;
  icon?: ReactNode;
}

/** Temporary placeholder for pages that are built in later phases. */
export function ComingSoon({ title, subtitle, phase, icon }: ComingSoonProps) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyState
        icon={icon ?? <Sparkles aria-hidden />}
        title="Something lovely is on its way"
        message={`This section is built in Phase ${phase}.`}
      />
    </>
  );
}
