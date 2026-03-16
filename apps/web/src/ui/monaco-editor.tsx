import { useEffect, useRef } from 'react';
import { monaco } from '../lib/monaco';

export function MonacoEditor({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

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
}
