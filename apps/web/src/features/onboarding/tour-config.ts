import type { DriveStep, Driver } from 'driver.js';
import type { SectionKey } from '@rendercv/contracts';
import { EVENTS } from '@rendercv/core';
import { capture } from '../../lib/analytics/posthog-client';
import { i18nStore, translate } from '../../lib/i18n/i18n-store';
import type { MessageKey } from '../../lib/i18n/messages';

const STEP_GROUP_MAP = [1, 2, 2, 2, 3, 4, 4, 5] as const;

interface TourContext {
  hasAiEditor: boolean;
  setActiveSection: (section: SectionKey) => void;
  openAiEditor: () => void;
  sendAiMessage: (content: string) => void;
  setMobilePane: (pane: 'editor' | 'preview') => void;
  sidebar: {
    isMobile: boolean;
    setOpenMobile: (value: boolean) => void;
  };
  onComplete: () => void;
}

export function buildTourSteps(ctx: TourContext, driverRef: () => Driver): DriveStep[] {
  // The tour is built once when it starts, so reading the language here is
  // enough — it cannot change mid-tour.
  const tr = (key: MessageKey) => translate(i18nStore.getSnapshot(), key);

  // The counter shown in the popover footer is driver.js' built-in progress
  // ("{{current}} of {{total}}"), which counts the steps that are actually
  // rendered. STEP_GROUP_MAP is kept only to tag analytics events with the
  // logical group a step belongs to.
  function trackStep(index: number) {
    capture(EVENTS.ONBOARDING_STEP_VIEWED, { step: index + 1, group: STEP_GROUP_MAP[index] });
  }

  const steps: Array<DriveStep | null> = [
    {
      element: '[data-onboarding="create-import"]',
      popover: {
        title: tr('tour.createImport.title'),
        description: tr('tour.createImport.body'),
        side: 'right',
        align: 'start',
        onNextClick: () => {
          if (ctx.sidebar.isMobile) ctx.sidebar.setOpenMobile(false);
          window.setTimeout(() => driverRef().moveNext(), ctx.sidebar.isMobile ? 300 : 0);
        }
      },
      onHighlightStarted: () => {
        trackStep(0);
        if (ctx.sidebar.isMobile) ctx.sidebar.setOpenMobile(true);
      }
    },
    {
      element: '[data-onboarding="editor-pane"]',
      popover: {
        title: tr('tour.editor.title'),
        description: tr('tour.editor.body'),
        side: 'right',
        align: 'start',
        onNextClick: () => driverRef().moveNext()
      },
      onHighlightStarted: () => {
        trackStep(1);
        if (ctx.sidebar.isMobile) {
          ctx.sidebar.setOpenMobile(false);
          ctx.setMobilePane('editor');
        }
      }
    },
    {
      element: '[data-onboarding="section-tabs"]',
      popover: {
        title: tr('tour.sectionTabs.title'),
        description: tr('tour.sectionTabs.body'),
        side: 'bottom',
        align: 'start',
        onNextClick: () => {
          ctx.setActiveSection('design');
          window.setTimeout(() => driverRef().moveNext(), 200);
        }
      },
      onHighlightStarted: () => trackStep(2)
    },
    {
      element: '[data-onboarding="editor-pane"]',
      popover: {
        title: 'Design Tab',
        description:
          "You're now on the Design tab. Choose themes, colors, fonts, margins, and other presentation settings.",
        side: 'right',
        align: 'start',
        onNextClick: () => {
          ctx.setActiveSection('cv');
          if (ctx.hasAiEditor) {
            ctx.openAiEditor();
            ctx.sendAiMessage('What can you do?');
          }
          window.setTimeout(() => driverRef().moveNext(), 200);
        }
      },
      onHighlightStarted: () => trackStep(3)
    },
    ctx.hasAiEditor
      ? {
      element: '[data-onboarding="ai-chat"]',
      popover: {
        title: tr('tour.ai.title'),
        description: tr('tour.ai.body'),
        side: 'top',
        align: 'center'
      },
      onHighlightStarted: () => {
        trackStep(4);
        ctx.openAiEditor();
        if (ctx.sidebar.isMobile) {
          ctx.sidebar.setOpenMobile(false);
          ctx.setMobilePane('editor');
        }
      }
    }
      : null,
    {
      element: '[data-onboarding="preview-pane"]',
      popover: {
        title: tr('tour.preview.title'),
        description: tr('tour.preview.body'),
        side: 'left',
        align: 'start'
      },
      onHighlightStarted: () => {
        trackStep(5);
        if (ctx.sidebar.isMobile) ctx.setMobilePane('preview');
      }
    },
    {
      element: '[data-onboarding="share-controls"]',
      popover: {
        title: tr('tour.share.title'),
        description: tr('tour.share.body'),
        side: 'bottom',
        align: 'center'
      },
      onHighlightStarted: () => trackStep(6)
    },
    {
      element: ctx.sidebar.isMobile
        ? '[data-onboarding="share-controls"]'
        : '[data-onboarding="data-export"]',
      popover: {
        title: tr('tour.backup.title'),
        description: tr('tour.backup.body'),
        side: 'bottom',
        align: 'center',
        onNextClick: () => ctx.onComplete()
      },
      onHighlightStarted: () => trackStep(7)
    }
  ];

  return steps.filter((step): step is DriveStep => step !== null);
}
