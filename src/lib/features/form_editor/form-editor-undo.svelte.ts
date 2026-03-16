import type { YamlSync } from './yaml-sync.svelte.js';

let currentSync: YamlSync | null = $state(null);

export const formEditorUndo = {
  register(sync: YamlSync) {
    currentSync = sync;
  },
  unregister() {
    currentSync = null;
  },
  get canUndo() {
    return currentSync?.canUndo ?? false;
  },
  get canRedo() {
    return currentSync?.canRedo ?? false;
  },
  undo() {
    return currentSync?.undo() ?? false;
  },
  redo() {
    return currentSync?.redo() ?? false;
  }
};
