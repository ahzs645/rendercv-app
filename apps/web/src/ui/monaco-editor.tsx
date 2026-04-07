import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { monaco } from '../lib/monaco';

export interface MonacoEditorHandle {
  focus: () => void;
  insertMarkdownLink: () => void;
  surroundSelection: (prefix: string, suffix: string, placeholder?: string) => void;
  revealText: (text: string) => boolean;
}

type MonacoEditorProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(function MonacoEditor({
  value,
  onChange,
  readOnly
}, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const initialValueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
    },
    revealText(text: string) {
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (!editor || !model) return false;
      const matches = model.findMatches(text, false, false, false, null, false);
      if (matches.length > 0) {
        const line = matches[0]!.range.startLineNumber;
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column: 1 });
        editor.focus();
        return true;
      }
      return false;
    }
  }));

  useEffect(() => {
    if (!hostRef.current || editorRef.current) {
      return;
    }

    const editor = monaco.editor.create(hostRef.current, {
      value: initialValueRef.current,
      language: 'yaml',
      automaticLayout: true,
      minimap: { enabled: false },
      wordWrap: 'on',
      fontSize: 14,
      readOnly: readOnly ?? false,
      theme: document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs'
    });

    const subscription = editor.onDidChangeModelContent(() => {
      onChangeRef.current(editor.getValue());
    });

    editorRef.current = editor;

    return () => {
      subscription.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (editor.getValue() !== value) {
      editor.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly: readOnly ?? false });
  }, [readOnly]);

  return <div ref={hostRef} className={`h-full min-h-[420px] w-full rounded-2xl border border-border ${readOnly ? 'opacity-60' : ''}`} />;
});
