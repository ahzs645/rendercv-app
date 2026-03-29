import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { classicTheme, defaultDesigns, fileStore, preferencesStore, resolveFileSections } from '@rendercv/core';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { useStore } from '../lib/use-store';
import { useIsMobile } from '../lib/use-mobile';
import { useViewerRenderer } from '../features/viewer/use-viewer-renderer';
import { parseCvVariantsYaml } from '../features/viewer/cv-variants';
import {
  repairFlattenedPositionDatesInCvYaml,
  stripPositionMarkersFromCvYaml
} from '../features/viewer/normalize-compat-cv';
import {
  normalizeLegacyDesignYaml,
  prepareViewerSections,
  resolveViewerSections
} from '../features/viewer/viewer-sections';
import { MonacoEditor } from './monaco-editor';
import type { MonacoEditorHandle } from './monaco-editor';
import { PreviewPaneView } from './preview-pane';
import { SectionTabs } from './section-tabs';
import { Sidebar } from './sidebar';
import { FormEditor } from '../features/form/form-editor';
import { WorkspaceToolbar } from './workspace-toolbar';

const SIDEBAR_DEFAULT_SIZE = 18;
const SIDEBAR_MIN_SIZE = 10;
const BUILT_IN_THEMES = new Set(Object.keys(defaultDesigns));

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
  const normalizedDesign = sections.design
    ? normalizeLegacyDesignYaml(sections.design)
    : sections.design;
  return {
    ...sections,
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
  const fileSnapshot = useStore(fileStore);
  const preferences = useStore(preferencesStore);
  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const monacoRef = useRef<MonacoEditorHandle>(null);
  const compatibilityRepairRef = useRef<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const selectedFile = fileSnapshot.files.find((file) => file.id === fileSnapshot.selectedFileId);
  const rawSections = selectedFile ? resolveFileSections(selectedFile) : undefined;
  const viewerSections = selectedFile ? resolveViewerSections(selectedFile) : undefined;
  const activeSection = preferences.activeSection;
  const currentValue = rawSections?.[activeSection] ?? '';
  const viewer = useViewerRenderer(viewerSections);

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

  // Auto-collapse sidebar panel on mobile; close mobile drawer when returning to desktop
  useEffect(() => {
    if (isMobile) {
      if (sidebarRef.current && !sidebarRef.current.isCollapsed()) {
        sidebarRef.current.collapse();
      }
    } else {
      setMobileOpen(false);
    }
  }, [isMobile]);

  // Close mobile drawer when a file is selected
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [fileSnapshot.selectedFileId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileOpen((v) => !v);
      return;
    }
    if (sidebarRef.current?.isCollapsed()) {
      sidebarRef.current.expand(SIDEBAR_DEFAULT_SIZE);
    } else {
      sidebarRef.current?.collapse();
    }
  }, [isMobile]);

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

  return (
    <div className="h-screen overflow-hidden bg-background">
      {isMobile ? (
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
          minSize={isMobile ? 0 : SIDEBAR_MIN_SIZE}
          onCollapse={() => setSidebarCollapsed(true)}
          onExpand={() => {
            if (!isMobile) setSidebarCollapsed(false);
          }}
        >
          {!isMobile ? sidebarElement : null}
        </Panel>
        <PanelResizeHandle
          className={`workspace-resize-handle ${sidebarCollapsed || isMobile ? 'hidden' : ''}`}
          disabled={isMobile}
        />
        <Panel defaultSize={82} minSize={35}>
          <div className="flex h-full flex-col">
            <header className="shrink-0 border-b border-border">
              <WorkspaceToolbar
                editorRef={monacoRef}
                onOpenPopup={() => {
                  window.open(`${import.meta.env.BASE_URL}preview`, '_blank', 'noopener,noreferrer');
                }}
                onToggleSidebar={toggleSidebar}
                sections={viewerSections}
                selectedFile={selectedFile}
                sidebarCollapsed={isMobile ? !mobileOpen : sidebarCollapsed}
                viewer={viewer}
              />
            </header>
            <PanelGroup className="min-h-0 flex-1" direction="horizontal">
              <Panel defaultSize={51} minSize={28}>
                <div className="flex h-full flex-col">
                  <div className="flex min-h-0 flex-1 flex-col">
                    <SectionTabs
                      active={activeSection}
                      onSelect={(section) => preferencesStore.patch({ activeSection: section })}
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
                    <div className="min-h-0 flex-1 p-5 pt-4">
                      {preferences.yamlEditor ? (
                        <MonacoEditor
                          ref={monacoRef}
                          value={currentValue}
                          onChange={(value) => fileStore.updateSection(activeSection, value)}
                        />
                      ) : (
                        <FormEditor
                          section={activeSection}
                          value={currentValue}
                          onChange={(value) => fileStore.updateSection(activeSection, value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="workspace-resize-handle" />
              <Panel defaultSize={49} minSize={25}>
                <PreviewPaneView
                  fileName={selectedFile?.name ?? 'RenderCV'}
                  sections={viewerSections}
                  showHeader={false}
                  viewer={viewer}
                />
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
      </PanelGroup>
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
