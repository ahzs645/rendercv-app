import type { SectionKey } from '@rendercv/contracts';
import { parseTutorialManifest, type TutorialManifest } from 'tourkit/core';
import type { TutorialPlayerActionExecutor, TutorialSemanticAction } from 'tourkit/player';
import type { MessageKey } from '../../lib/i18n/messages';

type MobilePane = 'editor' | 'preview';

/** The drawer's `duration-300` slide plus a frame or two for React to commit it. */
const SIDEBAR_TRANSITION_MS = 350;

/** What the tour's prepare actions can change in the workspace. */
export interface TourHost {
  isMobile: boolean;
  getActiveSection: () => SectionKey;
  setActiveSection: (section: SectionKey) => void;
  isMobileSidebarOpen: () => boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  getMobilePane: () => MobilePane;
  setMobilePane: (pane: MobilePane) => void;
  isAiEditorOpen: () => boolean;
  setAiEditorOpen: (open: boolean) => void;
  sendAiMessage?: (content: string) => void;
}

/**
 * Analytics numbering kept from the driver.js tour (step 1–8, groups 1–5), so
 * onboarding dashboards stay comparable even when the AI step is left out.
 */
const STEP_ANALYTICS: Record<string, { step: number; group: number }> = {
  'create-import': { step: 1, group: 1 },
  editor: { step: 2, group: 2 },
  'section-tabs': { step: 3, group: 2 },
  design: { step: 4, group: 2 },
  ai: { step: 5, group: 3 },
  preview: { step: 6, group: 4 },
  share: { step: 7, group: 4 },
  backup: { step: 8, group: 5 }
};

export function tourStepAnalytics(stepId: string) {
  return STEP_ANALYTICS[stepId];
}

const action = (id: string, args?: Record<string, string>): TutorialSemanticAction => ({
  id,
  match: 'subset',
  ...(args ? { args } : {})
});
const showSection = (section: SectionKey) => action('workspace.section', { section });
const showPane = (pane: MobilePane) => action('mobile.pane', { pane });

/**
 * The onboarding tour as a Tourkit lesson: reading steps, each naming the
 * control it explains and the navigation (`prepare`) that puts it on screen.
 * Prepare actions run again when the learner goes Back, so every step
 * establishes its own view instead of relying on the previous step's Next.
 */
export function buildTourManifest({
  hasAiEditor,
  isMobile,
  tr
}: {
  hasAiEditor: boolean;
  isMobile: boolean;
  tr: (key: MessageKey) => string;
}): TutorialManifest {
  const editorView = isMobile ? [action('sidebar.close'), showPane('editor')] : [];
  const closeAi = hasAiEditor ? [action('ai.close')] : [];

  const step = (
    id: string,
    anchor: { id: string; placement: 'top' | 'right' | 'bottom' | 'left'; align?: 'start' | 'center' },
    text: { title: MessageKey; body: MessageKey },
    prepare: TutorialSemanticAction[] = []
  ) => ({
    id,
    completion: 'continue' as const,
    anchor,
    ...(prepare.length ? { prepare } : {}),
    overlay: { title: tr(text.title), body: tr(text.body) }
  });

  const steps = [
    step(
      'create-import',
      { id: 'create-import', placement: 'right', align: 'start' },
      { title: 'tour.createImport.title', body: 'tour.createImport.body' },
      [...closeAi, ...(isMobile ? [action('sidebar.open')] : [])]
    ),
    step(
      'editor',
      { id: 'editor-pane', placement: 'right', align: 'start' },
      { title: 'tour.editor.title', body: 'tour.editor.body' },
      [...closeAi, ...editorView]
    ),
    step(
      'section-tabs',
      { id: 'section-tabs', placement: 'bottom', align: 'start' },
      { title: 'tour.sectionTabs.title', body: 'tour.sectionTabs.body' },
      [...closeAi, ...editorView, showSection('cv')]
    ),
    step(
      'design',
      { id: 'editor-pane', placement: 'right', align: 'start' },
      { title: 'tour.design.title', body: 'tour.design.body' },
      [...closeAi, ...editorView, showSection('design')]
    ),
    ...(hasAiEditor
      ? [
          step(
            'ai',
            { id: 'ai-chat', placement: 'top', align: 'center' },
            { title: 'tour.ai.title', body: 'tour.ai.body' },
            [
              ...editorView,
              showSection('cv'),
              action('ai.open'),
              action('ai.send', { content: 'What can you do?' })
            ]
          )
        ]
      : []),
    step(
      'preview',
      { id: 'preview-pane', placement: 'left', align: 'start' },
      { title: 'tour.preview.title', body: 'tour.preview.body' },
      [...closeAi, ...(isMobile ? [action('sidebar.close'), showPane('preview')] : []), showSection('cv')]
    ),
    step(
      'share',
      { id: 'share-controls', placement: 'bottom', align: 'center' },
      { title: 'tour.share.title', body: 'tour.share.body' },
      closeAi
    ),
    // App settings holds the data export on a desktop; on a phone the export
    // controls live behind the same "More actions" button as sharing.
    step(
      'backup',
      isMobile
        ? { id: 'share-controls', placement: 'bottom', align: 'center' }
        : { id: 'data-export', placement: 'right', align: 'center' },
      { title: 'tour.backup.title', body: 'tour.backup.body' },
      closeAi
    )
  ];

  return parseTutorialManifest({
    schemaVersion: 1,
    id: 'rendercv-onboarding',
    title: 'RenderCV tour',
    listed: false,
    defaultMode: 'practice',
    spotlightStyle: 'dim',
    interaction: 'guided',
    card: { placement: 'attached', size: 'compact', pointer: false },
    launch: { fixture: 'workspace' },
    chapters: [{ id: 'workspace', title: 'Workspace', steps }]
  });
}

function settle(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      window.clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

const nextFrames = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/**
 * Runs the tour's prepare actions against the workspace. Each one is a no-op
 * when the workspace already shows what it asks for, and waits only for a
 * change it actually made, so walking Back and Next stays quick.
 */
export function createTourActionExecutor(getHost: () => TourHost): TutorialPlayerActionExecutor {
  // Back and Next re-enter the AI step; the greeting goes out once per tour.
  let aiMessageSent = false;

  return async (tourAction, { signal }) => {
    const host = getHost();
    const args = tourAction.args ?? {};
    switch (tourAction.id) {
      case 'sidebar.open':
      case 'sidebar.close': {
        const open = tourAction.id === 'sidebar.open';
        if (!host.isMobile || host.isMobileSidebarOpen() === open) return;
        host.setMobileSidebarOpen(open);
        return settle(SIDEBAR_TRANSITION_MS, signal);
      }
      case 'mobile.pane': {
        const pane = args.pane as MobilePane;
        if (!host.isMobile || host.getMobilePane() === pane) return;
        host.setMobilePane(pane);
        return nextFrames();
      }
      case 'workspace.section': {
        const section = args.section as SectionKey;
        if (host.getActiveSection() === section) return;
        host.setActiveSection(section);
        return nextFrames();
      }
      case 'ai.open':
      case 'ai.close': {
        const open = tourAction.id === 'ai.open';
        if (host.isAiEditorOpen() === open) return;
        host.setAiEditorOpen(open);
        return nextFrames();
      }
      case 'ai.send':
        if (!aiMessageSent && typeof args.content === 'string') {
          aiMessageSent = true;
          host.sendAiMessage?.(args.content);
        }
        return;
      default:
        throw new Error(`Unknown tour action "${tourAction.id}".`);
    }
  };
}
