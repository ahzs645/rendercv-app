import type { DriveStep, Driver } from 'driver.js';
import type { SectionKey } from '@rendercv/contracts';
import { EVENTS } from '@rendercv/core';
import { capture } from '../../lib/analytics/posthog-client';

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
  // The AI Assistant step (index 4) is the sole member of group 3 and is dropped
  // when the AI editor is disabled. Renumber the groups that actually appear so the
  // counter stays contiguous (no skipped "3 of 5") and the total matches reality.
  const presentGroups = STEP_GROUP_MAP.filter(
    (group, index) => ctx.hasAiEditor || index !== 4
  );
  const groupTotal = new Set(presentGroups).size;
  const groupRemap = new Map(
    [...new Set(presentGroups)].map((group, index) => [group, index + 1])
  );

  function trackStep(index: number) {
    capture(EVENTS.ONBOARDING_STEP_VIEWED, { step: index + 1, group: STEP_GROUP_MAP[index] });
  }

  function patchCounter(popover: { wrapper: HTMLElement }, stepIndex: number) {
    const progress = popover.wrapper.querySelector('.driver-popover-progress-text');
    if (progress) {
      progress.textContent = `${groupRemap.get(STEP_GROUP_MAP[stepIndex])} of ${groupTotal}`;
    }
  }

  const steps: Array<DriveStep | null> = [
    {
      element: '[data-onboarding="create-import"]',
      popover: {
        title: 'Create & Import',
        description:
          'Start by creating a new CV from scratch or importing existing YAML/PDF content. The assistant can help turn rough content into a polished CV.',
        side: 'right',
        align: 'start',
        onPopoverRender: (popover: { wrapper: HTMLElement }) => patchCounter(popover, 0),
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
        title: 'Editor',
        description:
          'This is where you edit your CV content. Switch between the visual form editor and YAML using the toolbar.',
        side: 'right',
        align: 'start',
        onPopoverRender: (popover: { wrapper: HTMLElement }) => patchCounter(popover, 1),
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
        title: 'Section Tabs',
        description:
          'Switch between CV, Design, Locale, and Settings. Each tab customizes a different part of your resume.',
        side: 'bottom',
        align: 'start',
        onPopoverRender: (popover: { wrapper: HTMLElement }) => patchCounter(popover, 2),
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
        onPopoverRender: (popover: { wrapper: HTMLElement }) => patchCounter(popover, 3),
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
        title: 'AI Assistant',
        description:
          'Ask for stronger bullets, section rewrites, or tailoring help for a specific job description.',
        side: 'top',
        align: 'center',
        onPopoverRender: (popover: { wrapper: HTMLElement }) => patchCounter(popover, 4)
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
        title: 'Live Preview',
        description:
          'See the rendered CV update as you edit. Zoom in for details or open a popup for side-by-side editing.',
        side: 'left',
        align: 'start',
        onPopoverRender: (popover: { wrapper: HTMLElement }) => patchCounter(popover, 5)
      },
      onHighlightStarted: () => {
        trackStep(5);
        if (ctx.sidebar.isMobile) ctx.setMobilePane('preview');
      }
    },
    {
      element: '[data-onboarding="share-controls"]',
      popover: {
        title: 'Share',
        description:
          'Download your CV as a PDF, use native sharing, or generate a link when you are ready to send it.',
        side: 'bottom',
        align: 'center',
        onPopoverRender: (popover: { wrapper: HTMLElement }) => patchCounter(popover, 6)
      },
      onHighlightStarted: () => trackStep(6)
    },
    {
      element: ctx.sidebar.isMobile
        ? '[data-onboarding="share-controls"]'
        : '[data-onboarding="data-export"]',
      popover: {
        title: 'Backup & Export',
        description:
          'Export your data as a portable backup. RenderCV keeps your resume content portable instead of locked into the editor.',
        side: 'bottom',
        align: 'center',
        onPopoverRender: (popover: { wrapper: HTMLElement }) => patchCounter(popover, 7),
        onNextClick: () => ctx.onComplete()
      },
      onHighlightStarted: () => trackStep(7)
    }
  ];

  return steps.filter((step): step is DriveStep => step !== null);
}
