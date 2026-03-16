import { fileStore, localeLabel, preferencesStore, resolveFileSections, themeLabel } from '@rendercv/core';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useStore } from '../lib/use-store';
import { MonacoEditor } from './monaco-editor';
import { PreviewPane } from './preview-pane';
import { SectionTabs } from './section-tabs';
import { Sidebar } from './sidebar';
import { FormEditor } from '../features/form/form-editor';
import { WorkspaceAiEditor } from './workspace-ai-editor';

export function Workspace() {
  const fileSnapshot = useStore(fileStore);
  const preferences = useStore(preferencesStore);
  const selectedFile = fileSnapshot.files.find((file) => file.id === fileSnapshot.selectedFileId);
  const sections = selectedFile ? resolveFileSections(selectedFile) : undefined;
  const activeSection = preferences.activeSection;
  const currentValue = sections?.[activeSection] ?? '';

  return (
    <div className="h-screen overflow-hidden bg-background">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={19} minSize={16}>
          <Sidebar />
        </Panel>
        <PanelResizeHandle className="workspace-resize-handle" />
        <Panel defaultSize={41} minSize={28}>
          <div className="flex h-full flex-col">
            <header className="workspace-toolbar border-b border-border px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
                <h1 className="mt-1 text-xl font-semibold">{selectedFile?.name ?? 'RenderCV'}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <button
                  className={`rounded-xl px-3 py-2 ${preferences.yamlEditor ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground'}`}
                  onClick={() => preferencesStore.patch({ yamlEditor: true })}
                >
                  YAML
                </button>
                <button
                  className={`rounded-xl px-3 py-2 ${!preferences.yamlEditor ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground'}`}
                  onClick={() => preferencesStore.patch({ yamlEditor: false })}
                >
                  Form
                </button>
                <label className="flex items-center gap-2">
                  Theme
                  <select
                    className="rounded-lg border border-border bg-card px-2 py-1 text-foreground"
                    value={selectedFile?.selectedTheme ?? 'classic'}
                    onChange={(event) => selectedFile && fileStore.setTheme(selectedFile.id, event.target.value)}
                  >
                    {Object.keys(selectedFile?.designs ?? { classic: '' }).map((theme) => (
                      <option key={theme} value={theme}>
                        {themeLabel(theme)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  Locale
                  <select
                    className="rounded-lg border border-border bg-card px-2 py-1 text-foreground"
                    value={selectedFile?.selectedLocale ?? 'english'}
                    onChange={(event) => selectedFile && fileStore.setLocale(selectedFile.id, event.target.value)}
                  >
                    {Object.keys(selectedFile?.locales ?? { english: '' }).map((locale) => (
                      <option key={locale} value={locale}>
                        {localeLabel(locale)}
                      </option>
                    ))}
                  </select>
                </label>
                <WorkspaceAiEditor fileId={selectedFile?.id} sections={sections} />
              </div>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
              <SectionTabs active={activeSection} onSelect={(section) => preferencesStore.patch({ activeSection: section })} />
              <div className="min-h-0 flex-1">
                {preferences.yamlEditor ? (
                  <MonacoEditor
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
          <PreviewPane
            fileName={selectedFile?.name ?? 'RenderCV'}
            sections={sections}
            onOpenPopup={() => {
              window.open(`${import.meta.env.BASE_URL}preview`, '_blank', 'noopener,noreferrer');
            }}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
