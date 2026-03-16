import type { ExternalStore } from '@rendercv/core';
import { useSyncExternalStore } from 'react';

export function useStore<T>(store: ExternalStore<T>) {
  return useSyncExternalStore(store.subscribe.bind(store), store.getSnapshot.bind(store));
}
