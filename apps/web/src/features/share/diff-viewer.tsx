import { useEffect, useRef, useState } from 'react';
import type { CvFileSections, SectionKey } from '@rendercv/contracts';
import { SECTION_LABELS } from '@rendercv/contracts';
import { monaco } from '../../lib/monaco';
import { computeSectionDiffs } from './diff-utils';

const DIFF_SECTION_ORDER: SectionKey[] = ['cv', 'design', 'locale', 'settings'];

export function DiffViewer({
  origin,
  modified
}: {
  origin: CvFileSections;
  modified: CvFileSections;
}) {
  const [activeSection, setActiveSection] = useState<SectionKey>('cv');
  const diffs = computeSectionDiffs(origin, modified);
  const changedSections = diffs.filter((d) => d.changed);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Changes</h3>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {changedSections.length} section{changedSections.length !== 1 ? 's' : ''} modified
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Section tabs sidebar */}
        <div className="flex w-48 shrink-0 flex-col border-r border-border bg-sidebar">
          {DIFF_SECTION_ORDER.map((key) => {
            const diff = diffs.find((d) => d.key === key)!;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={`flex items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                  activeSection === key
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                <span>{SECTION_LABELS[key]}</span>
                {diff.changed ? (
                  <span className="flex items-center gap-1 text-xs">
                    {diff.addedLines > 0 && (
                      <span className="text-green-600">+{diff.addedLines}</span>
                    )}
                    {diff.removedLines > 0 && (
                      <span className="text-red-500">-{diff.removedLines}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/50">unchanged</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Monaco diff editor */}
        <div className="min-w-0 flex-1">
          <MonacoDiffPanel
            original={origin[activeSection] ?? ''}
            modified={modified[activeSection] ?? ''}
          />
        </div>
      </div>
    </div>
  );
}

function MonacoDiffPanel({
  original,
  modified
}: {
  original: string;
  modified: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IDiffEditor | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const diffEditor = monaco.editor.createDiffEditor(container, {
      readOnly: true,
      renderSideBySide: true,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      renderOverviewRuler: false,
      fontSize: 13,
      wordWrap: 'on'
    });

    editorRef.current = diffEditor;

    return () => {
      diffEditor.dispose();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const diffEditor = editorRef.current;
    if (!diffEditor) return;

    const originalModel = monaco.editor.createModel(original, 'yaml');
    const modifiedModel = monaco.editor.createModel(modified, 'yaml');

    diffEditor.setModel({ original: originalModel, modified: modifiedModel });

    return () => {
      originalModel.dispose();
      modifiedModel.dispose();
    };
  }, [original, modified]);

  return <div ref={containerRef} className="h-full w-full" />;
}
