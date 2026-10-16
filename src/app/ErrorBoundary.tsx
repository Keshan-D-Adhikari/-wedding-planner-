import { Component, type ErrorInfo, type ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { ErrorScreen } from '@/components/ErrorScreen';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render errors (including a lazy page chunk failing to download
 * after a new deploy) and shows a friendly screen instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected error:', error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          icon={<TriangleAlert aria-hidden size={40} />}
          title="Something went wrong"
          message="Don't worry — your plans are safely stored on this device. Reloading the page usually fixes this."
          actionLabel="Reload page"
          onAction={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
