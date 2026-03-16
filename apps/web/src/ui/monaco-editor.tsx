import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { monaco } from '../lib/monaco';

export interface MonacoEditorHandle {
  focus: () => void;
  insertMarkdownLink: () => void;
  surroundSelection: (prefix: string, suffix: string, placeholder?: string) => void;
}

type MonacoEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(function MonacoEditor({
  value,
  onChange
}, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  function editSelections(transform: (selected: string) => string) {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) {
      return;
    }

    const selections = editor.getSelections();
    if (!selections || selections.length === 0) {
      return;
    }

    editor.pushUndoStop();
    editor.executeEdits(
      'workspace-toolbar',
      selections.map((selection) => ({
        range: selection,
        text: transform(model.getValueInRange(selection))
      }))
    );
    editor.pushUndoStop();
    editor.focus();
  }

  useImperativeHandle(ref, () => ({
    focus() {
      editorRef.current?.focus();
    },
    insertMarkdownLink() {
      editSelections((selected) => `[${selected || 'label'}](https://)`);
    },
    surroundSelection(prefix, suffix, placeholder = 'text') {
      editSelections((selected) => `${prefix}${selected || placeholder}${suffix}`);
    }
  }));

  useEffect(() => {
    if (!hostRef.current || editorRef.current) {
      return;
    }

    const editor = monaco.editor.create(hostRef.current, {
      value,
      language: 'yaml',
      automaticLayout: true,
      minimap: { enabled: false },
      wordWrap: 'on',
      fontSize: 14,
      theme: document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs'
    });

    const subscription = editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });

    editorRef.current = editor;

    return () => {
      subscription.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, [onChange, value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (editor.getValue() !== value) {
      editor.setValue(value);
    }
  }, [value]);

  return <div ref={hostRef} className="h-full min-h-[420px] w-full rounded-2xl border border-border" />;
});
