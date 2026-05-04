import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { GitCompareArrows, Check, Pencil, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { classicTheme, defaultDesigns, fileStore, preferencesStore, resolveFileSections, reviewStore } from '@rendercv/core';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { toast } from 'sonner';
import { useStore } from '../lib/use-store';
import { useIsMobile } from '../lib/use-mobile';
import { useViewerRenderer } from '../features/viewer/use-viewer-renderer';
import { parseCvVariantsYaml } from '../features/viewer/cv-variants';
import {
  normalizeCompatibilityCvYaml,
  repairFlattenedPositionDatesInCvYaml,
  stripPositionMarkersFromCvYaml
} from '../features/viewer/normalize-compat-cv';
import {
  normalizeLegacyDesignYaml,
  prepareViewerSections,
  resolveViewerSections
} from '../features/viewer/viewer-sections';
import { buildYamlEntrySearchTerms } from '../features/viewer/svg-click-map';
import type { MonacoEditorHandle } from './monaco-editor';
import { PreviewPaneView } from './preview-pane';
import { SectionTabs } from './section-tabs';
import { Sidebar, SIDEBAR_MINI_WIDTH } from './sidebar';
import { FormEditor } from '../features/form/form-editor';
import { WorkspaceToolbar } from './workspace-toolbar';
import { OnboardingTour } from '../features/onboarding/OnboardingTour';
import { onboardingTour } from '../features/onboarding/tour-state';

const SIDEBAR_DEFAULT_SIZE = 18;
const SIDEBAR_MIN_SIZE = 10;
const SIDEBAR_OVERLAY_BREAKPOINT = Math.ceil(SIDEBAR_MINI_WIDTH / (SIDEBAR_DEFAULT_SIZE / 100));
const BUILT_IN_THEMES = new Set(Object.keys(defaultDesigns));
const MonacoEditor = lazy(() =>
  import('./monaco-editor').then((module) => ({ default: module.MonacoEditor }))
);

const LEGACY_DESIGN_KEY_PATTERN =
  /^\s*(font_size|page_size|keep_sections_together|keep_entries_together|prevent_orphaned_headers|section_heading_size)\s*:/m;

type ImportedSections = Partial<ReturnType<typeof resolveFileSections>> & {
  selectedTheme?: string;
  selectedLocale?: string;
};

function fillMissingSections(partialSections: Partial<ReturnType<typeof resolveFileSections>>) {
  return {
    cv: partialSections.cv ?? classicTheme.cv,
    design: partialSections.design ?? classicTheme.design,
    locale: partialSections.locale ?? classicTheme.locale,
    settings: partialSections.settings ?? classicTheme.settings
  };
}

function needsClassicCompatibilityTheme(selectedTheme: string | undefined) {
  return Boolean(selectedTheme && !BUILT_IN_THEMES.has(selectedTheme));
}

function looksLikeLegacyDesignSchema(design: string) {
  return LEGACY_DESIGN_KEY_PATTERN.test(design);
}

function normalizeCompatibilitySections(sections: ImportedSections): ImportedSections {
  const normalizedCv = sections.cv ? normalizeCompatibilityCvYaml(sections.cv) : sections.cv;
  const normalizedDesign = sections.design
    ? normalizeLegacyDesignYaml(sections.design)
    : sections.design;
  return {
    ...sections,
    cv: normalizedCv,
    design: normalizedDesign
  };
}

function createMinimalThemeDesign(themeName: string) {
  return `design:\n  theme: ${themeName}\n`;
}

function registerSharedThemeDesign(themeName: string | undefined, design: string | undefined) {
  if (!themeName || !design || BUILT_IN_THEMES.has(themeName)) {
    return;
  }

  preferencesStore.registerThemeDesign(themeName, design);
}

function isInteractiveElementFocused(): boolean {
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el.isContentEditable) {
    return true;
  }
  if (el.closest('[role="menu"],[role="listbox"],[role="dialog"]')) {
    return true;
  }
  // Monaco editor has its own undo/redo, skip when it's focused
  if (el.closest('.monaco-editor')) {
    return true;
  }
  return false;
}

export function Workspace() {
  const navigate = useNavigate();
  const fileSnapshot = useStore(fileStore);
  const reviewSnapshot = useStore(reviewStore);
  const preferences = useStore(preferencesStore);
  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const monacoRef = useRef<MonacoEditorHandle>(null);
  const compatibilityRepairRef = useRef<string | undefined>(undefined);
  const restoreInlineSidebarRef = useRef<boolean | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mobileWorkspace = useIsMobile();
  const sidebarOverlays = useIsMobile(SIDEBAR_OVERLAY_BREAKPOINT);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'editor' | 'preview'>('editor');
  const selectedFile = fileSnapshot.files.find((file) => file.id === fileSnapshot.selectedFileId);
  const rawSections = selectedFile ? resolveFileSections(selectedFile) : undefined;
  const viewerSections = selectedFile ? resolveViewerSections(selectedFile) : undefined;
  const selectedReviewSession = selectedFile
    ? reviewSnapshot.sessions.find(
        (session) =>
          session.linkedFileId === selectedFile.id ||
          session.mergeDraft?.draftFileId === selectedFile.id
      )
    : undefined;
  const isMergeDraft = Boolean(
    selectedFile && selectedReviewSession?.mergeDraft?.draftFileId === selectedFile.id
  );
  const activeSection = preferences.activeSection;
  const currentValue = rawSections?.[activeSection] ?? '';
  const viewer = useViewerRenderer(viewerSections);
  const handleSectionChange = useCallback(
    (nextValue: string) => {
      fileStore.updateSection(activeSection, nextValue);
    },
    [activeSection]
  );

  const handlePreviewSectionClick = useCallback(
    (sectionKey: string, entryIndex: number) => {
      // Switch to the CV tab if needed
      if (preferences.activeSection !== 'cv') {
        preferencesStore.patch({ activeSection: 'cv' });
      }
      if (mobileWorkspace) {
        setMobilePane('editor');
      }

      // Small delay to let the editor render after tab switch
      requestAnimationFrame(() => {
        if (preferences.yamlEditor) {
          // YAML mode: reveal the section in Monaco
          if (sectionKey === '__header__') {
            monacoRef.current?.revealText('name:');
          } else {
            const yamlSearchTerms =
              entryIndex >= 0 && rawSections?.cv
                ? buildYamlEntrySearchTerms(rawSections.cv, sectionKey, entryIndex)
                : [];
            const revealedEntry = yamlSearchTerms.some((term) => monacoRef.current?.revealText(term));
            if (!revealedEntry) {
              monacoRef.current?.revealText(`  ${sectionKey}:`);
            }
          }
        } else {
          // Form mode: scroll to the specific entry or section heading
          if (sectionKey === '__header__') {
            const editor = document.querySelector('[data-form-editor]');
            editor?.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }

          // Try to find the specific entry within the section
          const target =
            entryIndex >= 0
              ? document.querySelector(
                  `[data-section-key="${sectionKey}"][data-entry-index="${entryIndex}"]`
                )
              : null;

          // Fall back to the section article itself
          const el = target ?? document.querySelector(`article[data-section-key="${sectionKey}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el.classList.remove('section-highlight');
            void (el as HTMLElement).offsetWidth;
            el.classList.add('section-highlight');
          }
        }
      });
    },
    [preferences.activeSection, preferences.yamlEditor, mobileWorkspace, rawSections?.cv]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();

      // Cmd+Z → Undo
      if (key === 'z' && !e.shiftKey && !isInteractiveElementFocused()) {
        e.preventDefault();
        fileStore.undo();
        return;
      }

      // Cmd+Shift+Z or Ctrl+Y → Redo
      if (
        (key === 'z' && e.shiftKey && (e.metaKey || e.ctrlKey)) ||
        (key === 'y' && e.ctrlKey && !e.metaKey)
      ) {
        if (isInteractiveElementFocused()) return;
        e.preventDefault();
        fileStore.redo();
        return;
      }

      // Cmd+K → Toggle lock/unlock
      if (key === 'k') {
        e.preventDefault();
        if (isInteractiveElementFocused()) return;
        const file = fileSnapshot.files.find((f) => f.id === fileSnapshot.selectedFileId);
        if (!file) return;
        if (file.isLocked) {
          fileStore.unlockFile(file.id);
        } else {
          fileStore.lockFile(file.id);
        }
        return;
      }

      // Cmd+D → Duplicate
      if (key === 'd') {
        if (isInteractiveElementFocused()) return;
        e.preventDefault();
        const file = fileSnapshot.files.find((f) => f.id === fileSnapshot.selectedFileId);
        if (!file) return;
        fileStore.duplicateFile(file.id);
        return;
      }

      // Cmd+Backspace → Trash
      if (e.key === 'Backspace') {
        if (isInteractiveElementFocused()) return;
        e.preventDefault();
        const file = fileSnapshot.files.find((f) => f.id === fileSnapshot.selectedFileId);
        if (!file) return;
        fileStore.trashFile(file.id);
        return;
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [fileSnapshot.files, fileSnapshot.selectedFileId]);

  // Switch the sidebar into an overlay drawer before the default 18% panel shrinks into icon-only mode.
  useEffect(() => {
    if (sidebarOverlays) {
      if (restoreInlineSidebarRef.current === null) {
        restoreInlineSidebarRef.current = sidebarRef.current?.isCollapsed() ?? sidebarCollapsed;
      }

      if (sidebarRef.current && !sidebarRef.current.isCollapsed()) {
        sidebarRef.current.collapse();
      }
    } else {
      setMobileOpen(false);

      if (restoreInlineSidebarRef.current === false && sidebarRef.current?.isCollapsed()) {
        sidebarRef.current.expand(SIDEBAR_DEFAULT_SIZE);
      }

      restoreInlineSidebarRef.current = null;
    }
  }, [sidebarCollapsed, sidebarOverlays]);

  // Close overlay drawer when a file is selected.
  useEffect(() => {
    if (sidebarOverlays) {
      setMobileOpen(false);
    }
  }, [fileSnapshot.selectedFileId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSidebar = useCallback(() => {
    if (sidebarOverlays) {
      setMobileOpen((v) => !v);
      return;
    }
    if (sidebarRef.current?.isCollapsed()) {
      sidebarRef.current.expand(SIDEBAR_DEFAULT_SIZE);
    } else {
      sidebarRef.current?.collapse();
    }
  }, [sidebarOverlays]);

  useEffect(() => {
    if (!selectedFile || !rawSections?.cv.includes('RCVSPACING')) {
      return;
    }

    const strippedCv = stripPositionMarkersFromCvYaml(rawSections.cv);
    if (strippedCv !== rawSections.cv) {
      fileStore.updateSection('cv', strippedCv);
    }
  }, [rawSections?.cv, selectedFile]);

  useEffect(() => {
    if (!selectedFile || preferences.onboardingCompletedAt) {
      return;
    }

    const timer = window.setTimeout(() => onboardingTour.start(), 800);
    return () => window.clearTimeout(timer);
  }, [preferences.onboardingCompletedAt, selectedFile]);

  useEffect(() => {
    if (!selectedFile || selectedFile.selectedTheme === 'ahmadstyle' || !rawSections?.cv.includes(' | ')) {
      return;
    }

    const repairedCv = repairFlattenedPositionDatesInCvYaml(rawSections.cv);
    if (repairedCv !== rawSections.cv) {
      fileStore.updateSection('cv', repairedCv);
    }
  }, [rawSections?.cv, selectedFile]);

  useEffect(() => {
    if (!selectedFile || !rawSections || viewer.isInitializing || viewer.initError) {
      return;
    }

    const isCompatibilityFile =
      /^\s*social\s*:/m.test(rawSections.cv) ||
      /^\s*positions\s*:/m.test(rawSections.cv) ||
      /^\s*flavors\s*:/m.test(rawSections.cv) ||
      /^\s*itags\s*:/m.test(rawSections.cv) ||
      /^\s*tags\s*:/m.test(rawSections.cv) ||
      needsClassicCompatibilityTheme(selectedFile.selectedTheme) ||
      looksLikeLegacyDesignSchema(rawSections.design);

    if (!isCompatibilityFile) {
      return;
    }

    const repairKey = `${selectedFile.id}:${selectedFile.selectedTheme}:${rawSections.cv.length}:${rawSections.design.length}`;
    if (compatibilityRepairRef.current === repairKey) {
      return;
    }
    compatibilityRepairRef.current = repairKey;

    let cancelled = false;

    void viewer
      .validateSections(
        prepareViewerSections(fillMissingSections(normalizeCompatibilitySections(rawSections)))
      )
      .then(() => {
        if (cancelled) {
          return;
        }

        const normalizedDesign = normalizeLegacyDesignYaml(rawSections.design);
        if (normalizedDesign && normalizedDesign !== rawSections.design) {
          fileStore.updateSection('design', normalizedDesign);
        }

        const normalizedCv = normalizeCompatibilityCvYaml(rawSections.cv);
        if (normalizedCv !== rawSections.cv) {
          fileStore.updateSection('cv', normalizedCv);
        }

        registerSharedThemeDesign(selectedFile.selectedTheme, selectedFile.designs[selectedFile.selectedTheme]);

        if (needsClassicCompatibilityTheme(selectedFile.selectedTheme)) {
          return;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [rawSections, selectedFile, viewer]);

  const sidebarElement = (
    <Sidebar
      prepareYamlImport={async (importedSections) => {
        const normalizedSections = normalizeCompatibilitySections(importedSections);
        registerSharedThemeDesign(importedSections.selectedTheme, importedSections.design);

        const nextSections = {
          ...normalizedSections,
          cv: normalizedSections.cv ?? importedSections.cv ?? classicTheme.cv
        };
        const additionalDesigns: Record<string, string> = {};
        let message: string | undefined;

        const validatedSections = prepareViewerSections(fillMissingSections(nextSections));
        const validationResult = await viewer.validateSections(validatedSections);

        if (
          validationResult.usedFallbackTheme &&
          importedSections.selectedTheme &&
          importedSections.design &&
          importedSections.selectedTheme !== 'classic'
        ) {
          additionalDesigns[importedSections.selectedTheme] = importedSections.design;
          message = `YAML imported with compatibility mode. Preview will temporarily use classic until the ${importedSections.selectedTheme} theme zip is loaded.`;
        }

        return {
          sections: nextSections,
          additionalDesigns,
          message
        };
      }}
      validateYamlImport={async (importedSections) => {
        const result = await viewer.validateSections(
          prepareViewerSections({
            cv: importedSections.cv ?? classicTheme.cv,
            design: importedSections.design ?? classicTheme.design,
            locale: importedSections.locale ?? classicTheme.locale,
            settings: importedSections.settings ?? classicTheme.settings
          })
        );

        return (result.errors ?? []).map((error) => ({
          message: error.message || '',
          schema_location: error.schema_location || [],
          input: error.input || '',
          yaml_source:
            error.yaml_source === 'design_yaml_file'
              ? 'design'
              : error.yaml_source === 'locale_yaml_file'
                ? 'locale'
                : error.yaml_source === 'settings_yaml_file'
                  ? 'settings'
                  : 'cv',
          yaml_location: error.yaml_location || null
        }));
      }}
    />
  );

  const sectionTabsElement = (
    <SectionTabs
      active={activeSection}
      onSelect={(section) => {
        preferencesStore.patch({ activeSection: section });
        if (mobileWorkspace) {
          setMobilePane('editor');
        }
      }}
      onImportDesignTheme={
        selectedFile
          ? async (file) => {
              const result = await viewer.importThemeArchive(file);
              const nextDesign =
                preferencesStore.getSnapshot().themeLibrary[result.themeName] ??
                createMinimalThemeDesign(result.themeName);
              preferencesStore.registerThemeDesign(result.themeName, nextDesign);
              fileStore.setTheme(selectedFile.id, result.themeName);
              return result.themeName;
            }
          : undefined
      }
      onImportVariants={
        selectedFile
          ? async (file) => {
              const variants = parseCvVariantsYaml(await file.text());
              fileStore.setVariants(selectedFile.id, variants);
              return variants.full ? 'full' : Object.keys(variants)[0] ?? null;
            }
          : undefined
      }
      selectedFile={selectedFile}
      themeImportDisabled={viewer.isInitializing || Boolean(viewer.initError)}
      viewer={viewer}
      viewerSections={viewerSections}
    />
  );

  const editorPane = (
    <div className="flex min-h-0 flex-1 flex-col" data-onboarding="editor-pane">
      {isMergeDraft && selectedFile && selectedReviewSession ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary">
          <Pencil className="size-3.5 shrink-0" />
          <span className="mr-auto">
            Editing merge draft for an active review session. The linked resume will not change
            until you apply the merged result.
          </span>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              const sections = resolveFileSections(selectedFile);
              reviewStore.updateActiveProposalFromDraft(
                selectedReviewSession.sessionId,
                sections,
                selectedFile.name
              );
              toast.success('Proposal updated from merge draft.');
            }}
            type="button"
          >
            <Pencil className="size-3.5" />
            Update proposal
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            onClick={() => {
              const sections = resolveFileSections(selectedFile);
              const linkedFileId = selectedReviewSession.linkedFileId;

              if (linkedFileId && linkedFileId !== selectedFile.id) {
                fileStore.replaceFileSections(linkedFileId, sections);
                fileStore.selectFile(linkedFileId);
                fileStore.deleteFile(selectedFile.id);
                reviewStore.linkSessionToFile(selectedReviewSession.sessionId, linkedFileId);
              } else {
                const finalName = fileStore.uniqueName(
                  selectedReviewSession.baseFileName === selectedFile.name
                    ? selectedFile.name
                    : selectedReviewSession.baseFileName
                );
                fileStore.renameFile(selectedFile.id, finalName);
                reviewStore.linkSessionToFile(selectedReviewSession.sessionId, selectedFile.id);
                fileStore.selectFile(selectedFile.id);
              }

              reviewStore.resolveSession(selectedReviewSession.sessionId, sections, 'applied');
              toast.success('Merged result applied to resume.');
              navigate('/');
            }}
            type="button"
          >
            <Check className="size-3.5" />
            Apply merged result
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              fileStore.deleteFile(selectedFile.id);
              reviewStore.clearMergeDraft(selectedReviewSession.sessionId);
              if (selectedReviewSession.linkedFileId) {
                fileStore.selectFile(selectedReviewSession.linkedFileId);
                navigate('/');
              } else {
                navigate(`/review/${selectedReviewSession.sessionId}`);
              }
              toast.success('Merge draft discarded.');
            }}
            type="button"
          >
            <X className="size-3.5" />
            Discard draft
          </button>
        </div>
      ) : selectedFile?.sharedOrigin ? (
        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-600 dark:text-amber-400">
          <GitCompareArrows className="size-3.5 shrink-0" />
          <span>
            Reviewing shared CV — edits are tracked against the original.
            Changed fields are highlighted in the form view.
          </span>
        </div>
      ) : selectedReviewSession?.linkedFileId === selectedFile?.id ? (
        <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2 text-xs text-primary">
          <GitCompareArrows className="size-3.5 shrink-0" />
          <span>
            This resume is attached to a local review thread. Use Download &amp; share to send or
            forward review proposals.
          </span>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 p-4 pt-3 sm:p-5 sm:pt-4">
        {preferences.yamlEditor ? (
          <Suspense fallback={<EditorLoadingSkeleton />}>
            <MonacoEditor
              key={activeSection}
              ref={monacoRef}
              value={currentValue}
              onChange={handleSectionChange}
              readOnly={selectedFile?.isLocked}
            />
          </Suspense>
        ) : (
          <FormEditor
            key={activeSection}
            section={activeSection}
            value={currentValue}
            onChange={handleSectionChange}
            sharedOrigin={selectedFile?.sharedOrigin}
            readOnly={selectedFile?.isLocked}
            themeOptions={Array.from(
              new Set([
                ...Object.keys(defaultDesigns),
                ...Object.keys(preferences.themeLibrary),
                ...Object.keys(selectedFile?.designs ?? {})
              ])
            )}
            currentTheme={selectedFile?.selectedTheme}
            onThemeChange={
              selectedFile
                ? (theme: string) => fileStore.setTheme(selectedFile.id, theme)
                : undefined
            }
          />
        )}
      </div>
    </div>
  );

  const previewPane = (
    <PreviewPaneView
      fileName={selectedFile?.name ?? 'RenderCV'}
      sections={viewerSections}
      showHeader={false}
      viewer={viewer}
      onSectionClick={handlePreviewSectionClick}
    />
  );

  return (
    <div className="h-dvh overflow-hidden bg-background">
      <OnboardingTour
        isMobile={sidebarOverlays}
        onMobilePaneChange={setMobilePane}
        onOpenMobileSidebar={setMobileOpen}
      />
      {sidebarOverlays ? (
        <MobileSidebarDrawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
          {sidebarElement}
        </MobileSidebarDrawer>
      ) : null}
      <PanelGroup className="min-h-0 h-full" direction="horizontal">
        <Panel
          ref={sidebarRef}
          collapsedSize={0}
          collapsible
          defaultSize={SIDEBAR_DEFAULT_SIZE}
          minSize={sidebarOverlays ? 0 : SIDEBAR_MIN_SIZE}
          onCollapse={() => setSidebarCollapsed(true)}
          onExpand={() => {
            if (!sidebarOverlays) setSidebarCollapsed(false);
          }}
        >
          {!sidebarOverlays ? sidebarElement : null}
        </Panel>
        <PanelResizeHandle
          className={`workspace-resize-handle ${sidebarCollapsed || sidebarOverlays ? 'hidden' : ''}`}
          disabled={sidebarOverlays}
        />
        <Panel defaultSize={82} minSize={35}>
          <div className="flex h-full flex-col">
            <header className="shrink-0 border-b border-border">
              <WorkspaceToolbar
                editorRef={monacoRef}
                isMobile={mobileWorkspace}
                mobilePane={mobilePane}
                onOpenPopup={() => {
                  window.open(`${import.meta.env.BASE_URL}preview`, '_blank', 'noopener,noreferrer');
                }}
                onMobilePaneChange={setMobilePane}
                onToggleSidebar={toggleSidebar}
                sections={viewerSections}
                selectedFile={selectedFile}
                sidebarCollapsed={sidebarOverlays ? !mobileOpen : sidebarCollapsed}
                viewer={viewer}
              />
            </header>
            {mobileWorkspace ? (
              <div className="flex min-h-0 flex-1 flex-col">
                {mobilePane === 'editor' ? sectionTabsElement : null}
                {mobilePane === 'editor' ? editorPane : previewPane}
              </div>
            ) : (
              <PanelGroup className="min-h-0 flex-1" direction="horizontal">
                <Panel defaultSize={51} minSize={28}>
                  <div className="flex h-full flex-col">
                    <div className="flex min-h-0 flex-1 flex-col">
                      {sectionTabsElement}
                      {editorPane}
                    </div>
                  </div>
                </Panel>
                <PanelResizeHandle className="workspace-resize-handle" />
                <Panel defaultSize={49} minSize={25}>
                  {previewPane}
                </Panel>
              </PanelGroup>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

function EditorLoadingSkeleton() {
  return (
    <div className="flex h-full min-h-[420px] w-full flex-col rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 h-4 w-24 animate-pulse rounded-full bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={index}
            className="h-3 animate-pulse rounded-full bg-muted/70"
            style={{ width: `${92 - (index % 5) * 9}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function MobileSidebarDrawer({
  children,
  open,
  onClose
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-[360px]:w-60 transform shadow-xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {children}
      </div>
    </>
  );
}
