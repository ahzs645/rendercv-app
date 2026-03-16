import { useRef, useState } from 'react';
import { fileStore, preferencesStore, resolveFileSections } from '@rendercv/core';
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
    <div className="flex h-screen flex-col overflow-hidden bg-background">
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
        <Panel
          ref={sidebarRef}
          collapsedSize={0}
          collapsible
          defaultSize={SIDEBAR_DEFAULT_SIZE}
          minSize={SIDEBAR_MIN_SIZE}
          onCollapse={() => setSidebarCollapsed(true)}
          onExpand={() => setSidebarCollapsed(false)}
        >
          <Sidebar />
        </Panel>
        <PanelResizeHandle className={`workspace-resize-handle ${sidebarCollapsed ? 'hidden' : ''}`} />
        <Panel defaultSize={41} minSize={28}>
          <div className="flex h-full flex-col">
            <div className="flex min-h-0 flex-1 flex-col">
              <SectionTabs
                active={activeSection}
                onSelect={(section) => preferencesStore.patch({ activeSection: section })}
                selectedFile={selectedFile}
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
        <Panel defaultSize={40} minSize={25}>
          <PreviewPaneView
            fileName={selectedFile?.name ?? 'RenderCV'}
            selectedFile={selectedFile}
            sections={sections}
            showHeader={false}
            viewer={viewer}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
