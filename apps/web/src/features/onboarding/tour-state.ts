import { createStore, EVENTS, preferencesStore } from '@rendercv/core';
import { capture } from '../../lib/analytics/posthog-client';

interface OnboardingTourSnapshot {
  isRunning: boolean;
}

class OnboardingTourState {
  readonly #store = createStore<OnboardingTourSnapshot>({ isRunning: false });

  getSnapshot() {
    return this.#store.getSnapshot();
  }

  subscribe(listener: () => void) {
    return this.#store.subscribe(listener);
  }

  start() {
    preferencesStore.patch({ aiEditorOpen: true });
    this.#store.setSnapshot({ isRunning: true });
    capture(EVENTS.ONBOARDING_STARTED);
  }

  complete() {
    this.#finish(EVENTS.ONBOARDING_COMPLETED);
  }

  skip() {
    this.#finish(EVENTS.ONBOARDING_SKIPPED);
  }

  #finish(eventName: typeof EVENTS.ONBOARDING_COMPLETED | typeof EVENTS.ONBOARDING_SKIPPED) {
    this.#store.setSnapshot({ isRunning: false });
    preferencesStore.patch({ onboardingCompletedAt: new Date().toISOString() });
    capture(eventName);
  }
}

export const onboardingTour = new OnboardingTourState();

