import { useEffect, useRef, useState } from 'react';
import { classicTheme, fileStore, preferencesStore, resolveFileSections } from '@rendercv/core';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { useStore } from '../lib/use-store';
import { useViewerRenderer } from '../features/viewer/use-viewer-renderer';
import { parseCvVariantsYaml } from '../features/viewer/cv-variants';
import { normalizeCompatibilityCvYaml } from '../features/viewer/normalize-compat-cv';
import { normalizeLegacyDesignYaml, resolveViewerSections } from '../features/viewer/viewer-sections';
import { MonacoEditor } from './monaco-editor';
import type { MonacoEditorHandle } from './monaco-editor';
import { PreviewPaneView } from './preview-pane';
import { SectionTabs } from './section-tabs';
import { Sidebar } from './sidebar';
import { FormEditor } from '../features/form/form-editor';
import { WorkspaceToolbar } from './workspace-toolbar';

const SIDEBAR_DEFAULT_SIZE = 18;
const SIDEBAR_MIN_SIZE = 10;
const BUILT_IN_THEMES = new Set([
  'classic',
  'engineeringclassic',
  'engineeringresumes',
  'moderncv',
  'sb2nov'
]);

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

export function Workspace() {
  const fileSnapshot = useStore(fileStore);
  const preferences = useStore(preferencesStore);
  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const monacoRef = useRef<MonacoEditorHandle>(null);
  const compatibilityRepairRef = useRef<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const selectedFile = fileSnapshot.files.find((file) => file.id === fileSnapshot.selectedFileId);
  const rawSections = selectedFile ? resolveFileSections(selectedFile) : undefined;
  const viewerSections = selectedFile ? resolveViewerSections(selectedFile) : undefined;
  const activeSection = preferences.activeSection;
  const currentValue = rawSections?.[activeSection] ?? '';
  const viewer = useViewerRenderer(viewerSections);

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
      .validateSections(fillMissingSections(normalizeCompatibilitySections(rawSections)))
      .then((validationResult) => {
        if (cancelled) {
          return;
        }

        const normalizedCv = normalizeCompatibilityCvYaml(rawSections.cv);
        if (normalizedCv !== rawSections.cv) {
          fileStore.updateSection('cv', normalizedCv);
        }

        const normalizedDesign = normalizeLegacyDesignYaml(rawSections.design);
        if (normalizedDesign && normalizedDesign !== rawSections.design) {
          fileStore.updateSection('design', normalizedDesign);
        }

        registerSharedThemeDesign(selectedFile.selectedTheme, selectedFile.designs[selectedFile.selectedTheme]);

        if (needsClassicCompatibilityTheme(selectedFile.selectedTheme)) {
          return;
        }

        if (selectedFile.selectedTheme === 'classic' && looksLikeLegacyDesignSchema(rawSections.design)) {
          fileStore.updateSection('design', classicTheme.design);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [rawSections, selectedFile, viewer]);

  return (
    <div className="h-screen overflow-hidden bg-background">
      <PanelGroup className="min-h-0 h-full" direction="horizontal">
        <Panel
          ref={sidebarRef}
          collapsedSize={0}
          collapsible
          defaultSize={SIDEBAR_DEFAULT_SIZE}
          minSize={SIDEBAR_MIN_SIZE}
          onCollapse={() => setSidebarCollapsed(true)}
          onExpand={() => setSidebarCollapsed(false)}
        >
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

              if (nextSections.selectedTheme === 'classic' && nextSections.design) {
                if (looksLikeLegacyDesignSchema(nextSections.design)) {
                  nextSections.design = classicTheme.design;
                }
              }

              const validatedSections = fillMissingSections(nextSections);
              const validationResult = await viewer.validateSections(validatedSections);

              if (
                validationResult.usedFallbackTheme &&
                importedSections.selectedTheme &&
                importedSections.design &&
                importedSections.selectedTheme !== 'classic'
              ) {
                additionalDesigns[importedSections.selectedTheme] = importedSections.design;
                message = `YAML imported with compatibility mode. Preview will temporarily use classic until the ${importedSections.selectedTheme} theme zip is loaded.`;
              } else if (
                nextSections.selectedTheme === 'classic' &&
                nextSections.design &&
                looksLikeLegacyDesignSchema(nextSections.design)
              ) {
                nextSections.design = classicTheme.design;
              }

              return {
                sections: nextSections,
                additionalDesigns,
                message
              };
            }}
            validateYamlImport={async (importedSections) => {
              const result = await viewer.validateSections({
                cv: importedSections.cv ?? classicTheme.cv,
                design: importedSections.design ?? classicTheme.design,
                locale: importedSections.locale ?? classicTheme.locale,
                settings: importedSections.settings ?? classicTheme.settings
              });

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
        </Panel>
        <PanelResizeHandle className={`workspace-resize-handle ${sidebarCollapsed ? 'hidden' : ''}`} />
        <Panel defaultSize={82} minSize={35}>
          <div className="flex h-full flex-col">
            <header className="shrink-0 border-b border-border">
              <WorkspaceToolbar
                editorRef={monacoRef}
                onOpenPopup={() => {
                  window.open(`${import.meta.env.BASE_URL}preview`, '_blank', 'noopener,noreferrer');
                }}
                onToggleSidebar={() => {
                  if (sidebarRef.current?.isCollapsed()) {
                    sidebarRef.current.expand(SIDEBAR_DEFAULT_SIZE);
                    return;
                  }

                  sidebarRef.current?.collapse();
                }}
                sections={viewerSections}
                selectedFile={selectedFile}
                sidebarCollapsed={sidebarCollapsed}
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
