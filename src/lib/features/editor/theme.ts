import type * as Monaco from 'monaco-editor';

type ThemeColors = {
  background: string;
  foreground: string;
  selection: string;
  lineHighlight: string;
  cursor: string;
  lineNumber: string;
  lineNumberActive: string;
  key: string;
  comment: string;
  string: string;
  number: string;
  keyword: string;
};

const LIGHT: ThemeColors = {
  background: '#ffffff',
  foreground: '#111827',
  selection: '#bfdbfe',
  lineHighlight: '#00000008',
  cursor: '#111827',
  lineNumber: '#6b7280',
  lineNumberActive: '#111827',
  key: '#111827',
  comment: '#6b7280',
  string: '#0f766e',
  number: '#0f766e',
  keyword: '#1f2937'
};

const DARK: ThemeColors = {
  background: '#020618',
  foreground: '#f8fafc',
  selection: '#2563eb55',
  lineHighlight: '#ffffff0a',
  cursor: '#f9fafb',
  lineNumber: '#9ca3af',
  lineNumberActive: '#f9fafb',
  key: '#93c5fd',
  comment: '#009689',
  string: '#ffb900',
  number: '#ffb900',
  keyword: '#93c5fd'
};

function ruleHex(color: string): string {
  return color.startsWith('#') ? color.slice(1) : color;
}

function buildThemeData(
  base: 'vs' | 'vs-dark',
  colors: ThemeColors
): Monaco.editor.IStandaloneThemeData {
  return {
    base,
    inherit: false,
    rules: [
      { token: 'type', foreground: ruleHex(colors.key) },
      { token: 'comment', foreground: ruleHex(colors.comment) },
      { token: 'string', foreground: ruleHex(colors.string) },
      { token: 'number', foreground: ruleHex(colors.number) },
      { token: 'keyword', foreground: ruleHex(colors.keyword) },
      { token: 'namespace', foreground: ruleHex(colors.string) },
      { token: 'identifier', foreground: ruleHex(colors.string) }
    ],
    colors: {
      'editor.background': colors.background,
      'editor.foreground': colors.foreground,
      'editorCursor.foreground': colors.cursor,
      'editor.selectionBackground': colors.selection,
      'editor.lineHighlightBackground': colors.lineHighlight,
      'editorLineNumber.foreground': colors.lineNumber,
      'editorLineNumber.activeForeground': colors.lineNumberActive
    }
  };
}

export function defineThemes(monaco: typeof Monaco): void {
  monaco.editor.defineTheme('yaml-light', buildThemeData('vs', LIGHT));
  monaco.editor.defineTheme('yaml-dark', buildThemeData('vs-dark', DARK));
}

export function applyTheme(monaco: typeof Monaco): void {
  const isDark = document.documentElement.classList.contains('dark');
  monaco.editor.setTheme(isDark ? 'yaml-dark' : 'yaml-light');
}
