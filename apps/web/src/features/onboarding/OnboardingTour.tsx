import { useEffect, useRef } from 'react';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tour-popover.css';
import { preferencesStore } from '@rendercv/core';
import { useStore } from '../../lib/use-store';
import { buildTourSteps } from './tour-config';
import { onboardingTour } from './tour-state';
import { ENABLE_AI_EDITOR } from '../../lib/feature-flags';

export function OnboardingTour({
  isMobile,
  onOpenMobileSidebar,
  onMobilePaneChange,
  onSendAiMessage
}: {
  isMobile: boolean;
  onOpenMobileSidebar: (value: boolean) => void;
  onMobilePaneChange: (pane: 'editor' | 'preview') => void;
  onSendAiMessage?: (content: string) => void;
}) {
  const { isRunning } = useStore(onboardingTour);
  const driverRef = useRef<Driver | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!isRunning) {
      if (driverRef.current?.isActive()) {
        driverRef.current.destroy();
      }
      return;
    }

    handledRef.current = false;
    const tour = driver({
      animate: true,
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      doneBtnText: 'Done',
      allowClose: true,
      overlayColor: 'black',
      overlayOpacity: 0.7,
      stagePadding: 8,
      stageRadius: 8,
      popoverOffset: 12,
      onCloseClick: () => {
        handledRef.current = true;
        tour.destroy();
        onboardingTour.skip();
      },
      onDestroyed: () => {
        if (handledRef.current) {
          return;
        }
        handledRef.current = true;
        onboardingTour.skip();
      },
      steps: buildTourSteps(
        {
          hasAiEditor: ENABLE_AI_EDITOR,
          setActiveSection: (section) => preferencesStore.patch({ activeSection: section }),
          openAiEditor: () => preferencesStore.patch({ aiEditorOpen: true }),
          sendAiMessage: (content) => onSendAiMessage?.(content),
          setMobilePane: onMobilePaneChange,
          sidebar: {
            isMobile,
            setOpenMobile: onOpenMobileSidebar
          },
          onComplete: () => {
            handledRef.current = true;
            tour.destroy();
            onboardingTour.complete();
          }
        },
        () => tour
      )
    });

    driverRef.current = tour;
    tour.drive();

    return () => {
      if (tour.isActive()) {
        tour.destroy();
      }
    };
  }, [isMobile, isRunning, onMobilePaneChange, onOpenMobileSidebar, onSendAiMessage]);

  return null;
}
