import { Heart } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { LinkButton } from '@/components/Button';

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={<Heart aria-hidden />}
      title="This page wandered off"
      message="We couldn't find what you were looking for."
      action={<LinkButton to="/">Back to dashboard</LinkButton>}
    />
  );
}
