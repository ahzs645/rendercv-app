import { useEffect, useMemo, useRef } from 'react';
import { NEUTRAL_TUTORIAL_DOM_POLICY, TutorialPlayer, type TutorialPlayerLabels } from 'tourkit/player';
import './tour-popover.css';
import { EVENTS, preferencesStore } from '@rendercv/core';
import { capture } from '../../lib/analytics/posthog-client';
import { useStore } from '../../lib/use-store';
import { useTranslation } from '../../lib/i18n/use-translation';
import { ENABLE_AI_EDITOR } from '../../lib/feature-flags';
import { buildTourManifest, createTourActionExecutor, tourStepAnalytics, type TourHost } from './tour-config';
import { TourCard } from './TourCard';
import { onboardingTour } from './tour-state';

interface OnboardingTourProps {
  isMobile: boolean;
  mobileSidebarOpen: boolean;
  mobilePane: 'editor' | 'preview';
  onOpenMobileSidebar: (value: boolean) => void;
  onMobilePaneChange: (pane: 'editor' | 'preview') => void;
  onSendAiMessage?: (content: string) => void;
}

export function OnboardingTour(props: OnboardingTourProps) {
  const { isRunning } = useStore(onboardingTour);
  const { language } = useTranslation();
  if (!isRunning) {
    return null;
  }
  // A viewport or language switch rebuilds the steps (their anchors and words
  // differ), so the tour starts over rather than continuing on stale steps.
  return <OnboardingTourRun key={`${props.isMobile ? 'mobile' : 'desktop'}:${language}`} {...props} />;
}

function OnboardingTourRun({
  isMobile,
  mobileSidebarOpen,
  mobilePane,
  onOpenMobileSidebar,
  onMobilePaneChange,
  onSendAiMessage
}: OnboardingTourProps) {
  const { t } = useTranslation();

  // The executor reads the workspace as it is when a step opens, not as it
  // was when the tour started.
  const hostRef = useRef<TourHost | null>(null);
  hostRef.current = {
    isMobile,
    getActiveSection: () => preferencesStore.getSnapshot().activeSection,
    setActiveSection: (section) => preferencesStore.patch({ activeSection: section }),
    isMobileSidebarOpen: () => mobileSidebarOpen,
    setMobileSidebarOpen: onOpenMobileSidebar,
    getMobilePane: () => mobilePane,
    setMobilePane: onMobilePaneChange,
    isAiEditorOpen: () => preferencesStore.getSnapshot().aiEditorOpen,
    setAiEditorOpen: (open) => preferencesStore.patch({ aiEditorOpen: open }),
    sendAiMessage: onSendAiMessage
  };
  const executeAction = useMemo(() => createTourActionExecutor(() => hostRef.current!), []);

  const manifest = useMemo(
    () => buildTourManifest({ hasAiEditor: ENABLE_AI_EDITOR, isMobile, tr: t }),
    [isMobile, t]
  );
  const labels = useMemo<Partial<TutorialPlayerLabels>>(
    () => ({
      practice: '',
      // The catalogue writes placeholders as {{current}}; Tourkit fills {current}.
      progress: t('tour.progress').replace(/\{\{(\w+)\}\}/g, '{$1}'),
      previous: t('tour.previous'),
      next: t('tour.next'),
      finish: t('tour.done'),
      skip: t('tour.skip'),
      stop: t('tour.close'),
      blockedHint: t('tour.blocked')
    }),
    [t]
  );

  useEffect(() => {
    // Leaving the tour on a phone puts the drawer away with it.
    return () => {
      if (hostRef.current?.isMobile && hostRef.current.isMobileSidebarOpen()) {
        hostRef.current.setMobileSidebarOpen(false);
      }
    };
  }, []);

  return (
    <TutorialPlayer
      manifest={manifest}
      mode="practice"
      domPolicy={NEUTRAL_TUTORIAL_DOM_POLICY}
      onExecuteAction={executeAction}
      persistProgress={false}
      keyboardNavigation
      transitionMs={250}
      labels={labels}
      appearance={{
        overlayColor: 'black',
        overlayOpacity: 0.7,
        stagePadding: 8,
        stageRadius: 8,
        // With the control's own clearance, this keeps driver's 12px popover offset.
        cardGap: 6,
        ring: false
      }}
      renderCard={(card) => <TourCard card={card} />}
      onStepChange={(step) => capture(EVENTS.ONBOARDING_STEP_VIEWED, tourStepAnalytics(step.id))}
      onComplete={() => onboardingTour.complete()}
      onStop={() => onboardingTour.skip()}
    />
  );
}
