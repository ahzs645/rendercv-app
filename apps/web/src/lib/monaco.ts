// The core editor without the bundled language services, plus YAML. Its ESM
// modules import their own CSS, so the stylesheet loads with this chunk.
import * as monaco from 'monaco-editor/editor';
import 'monaco-editor/languages/definitions/yaml/register';
import editorWorker from 'monaco-editor/editor/editor.worker?worker';

(self as typeof self & {
  MonacoEnvironment?: {
    getWorker: () => Worker;
  };
}).MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  }
};

export { monaco };
