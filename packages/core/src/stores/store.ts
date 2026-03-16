export type Listener = () => void;

export interface ExternalStore<T> {
  getSnapshot(): T;
  subscribe(listener: Listener): () => void;
}

export function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<Listener>();

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    getSnapshot() {
      return state;
    },
    setSnapshot(nextState: T) {
      state = nextState;
      notify();
    },
    update(updater: (current: T) => T) {
      state = updater(state);
      notify();
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
