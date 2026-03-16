// Shim: loads pyodide.js into the worker global scope.
// Wraps in a promise so the worker can await it before using loadPyodide.

let _resolve: (lp: any) => void;
export const pyodideReady: Promise<void> = new Promise((r) => { _resolve = r; });

const PYODIDE_URL = self.location.origin + '/rendercv-app/cdn/pyodide/v0.29.3/full/pyodide.js';

fetch(PYODIDE_URL)
  .then((res) => res.text())
  .then((text) => {
    (0, eval)(text);
    _resolve(undefined);
  });

export function getLoadPyodide() {
  return (globalThis as any).loadPyodide as typeof import('pyodide').loadPyodide;
}

export type { PyodideInterface } from 'pyodide';
