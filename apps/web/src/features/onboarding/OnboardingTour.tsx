import { Component, lazy, Suspense, type ReactNode } from 'react';
import { useTranslation } from '../../lib/i18n/use-translation';
import { useStore } from '../../lib/use-store';
import type { OnboardingTourProps } from './OnboardingTourRun';
import { onboardingTour } from './tour-state';

const OnboardingTourRun = lazy(() => import('./OnboardingTourRun'));

/**
 * The tour is an extra, so its failures stay its own: a stale chunk after a
 * deploy or a throw in the player stands the tour down and leaves the workspace
 * on screen. Onboarding is not recorded as finished, so it can run next visit.
 */
class TourBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('The onboarding tour failed and was closed.', error);
    onboardingTour.abort();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function OnboardingTour(props: OnboardingTourProps) {
  const { isRunning } = useStore(onboardingTour);
  const { language } = useTranslation();
  if (!isRunning) {
    return null;
  }
  // A viewport or language switch rebuilds the steps (their anchors and words
  // differ), so the tour starts over rather than continuing on stale steps.
  return (
    <TourBoundary>
      <Suspense fallback={null}>
        <OnboardingTourRun key={`${props.isMobile ? 'mobile' : 'desktop'}:${language}`} {...props} />
      </Suspense>
    </TourBoundary>
  );
}
