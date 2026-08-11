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

    const skipTour = () => {
      handledRef.current = true;
      driverRef.current?.destroy();
      onboardingTour.skip();
    };

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
      onPopoverRender: (popover: { footer: HTMLElement }) => {
        const { footer } = popover;
        if (!footer) {
          return;
        }

        // driver.js renders "Previous" on step 1 looking exactly as it does on
        // step 4, where it works. Disable it when there is nothing to go back
        // to. Runs on every popover render, before the skip-button guard.
        const previous = footer.querySelector<HTMLButtonElement>('.driver-popover-prev-btn');
        if (previous) {
          const isFirstStep = driverRef.current?.getActiveIndex() === 0;
          previous.disabled = isFirstStep;
          previous.style.opacity = isFirstStep ? '0.4' : '';
          previous.style.cursor = isFirstStep ? 'not-allowed' : '';
        }

        if (footer.querySelector('[data-onboarding-skip]')) {
          return;
        }
        const skip = document.createElement('button');
        skip.type = 'button';
        skip.textContent = 'Skip tour';
        // The class must NOT contain "driver-popover": driver.js runs a
        // capture-phase document listener that calls stopImmediatePropagation()
        // on every popover child whose className includes that string, which
        // would keep this button's own click handler from ever firing.
        skip.className = 'tour-skip-btn';
        skip.setAttribute('data-onboarding-skip', '');
        skip.addEventListener('click', skipTour);
        footer.insertBefore(skip, footer.firstChild);
      },
      onCloseClick: skipTour,
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
