import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

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
