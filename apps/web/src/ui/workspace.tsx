import { useRef, useState } from 'react';
import { classicTheme, fileStore, preferencesStore, resolveFileSections } from '@rendercv/core';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { useStore } from '../lib/use-store';
import { useViewerRenderer } from '../features/viewer/use-viewer-renderer';
import { MonacoEditor } from './monaco-editor';
import type { MonacoEditorHandle } from './monaco-editor';
import { PreviewPaneView } from './preview-pane';
import { SectionTabs } from './section-tabs';
import { Sidebar } from './sidebar';
import { FormEditor } from '../features/form/form-editor';
import { WorkspaceToolbar } from './workspace-toolbar';

const SIDEBAR_DEFAULT_SIZE = 18;
const SIDEBAR_MIN_SIZE = 10;

function withThemeOverride(design: string, themeName: string) {
  if (!design.trim()) {
    return `design:\n  theme: ${themeName}\n`;
  }

  if (/^\s*theme:\s*.+$/m.test(design)) {
    return design.replace(/(^\s*theme:\s*).+$/m, `$1${themeName}`);
  }

  if (/^\s*design:\s*$/m.test(design)) {
    return design.replace(/(^\s*design:\s*$)/m, `$1\n  theme: ${themeName}`);
  }

  return `design:\n  theme: ${themeName}\n`;
}

export function Workspace() {
  const fileSnapshot = useStore(fileStore);
  const preferences = useStore(preferencesStore);
  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const monacoRef = useRef<MonacoEditorHandle>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const selectedFile = fileSnapshot.files.find((file) => file.id === fileSnapshot.selectedFileId);
  const sections = selectedFile ? resolveFileSections(selectedFile) : undefined;
  const activeSection = preferences.activeSection;
  const currentValue = sections?.[activeSection] ?? '';
  const viewer = useViewerRenderer(sections);

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
            validateYamlImport={async (content) => {
              const result = await viewer.validateSections({
                cv: content,
                design: classicTheme.design,
                locale: classicTheme.locale,
                settings: classicTheme.settings
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
                sections={sections}
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
                              const nextDesign = withThemeOverride(sections?.design ?? '', result.themeName);
                              fileStore.addDesignVariant(selectedFile.id, result.themeName, nextDesign);
                              return result.themeName;
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
                  sections={sections}
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
