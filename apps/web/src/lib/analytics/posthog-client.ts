import posthog from 'posthog-js';

let initialized = false;
let hasInteracted = false;
const buffer: Array<{ event: string; properties?: Record<string, unknown> }> = [];

const INTERACTION_EVENTS = ['click', 'keydown', 'touchstart'] as const;

function onInteraction() {
  if (hasInteracted) return;
  hasInteracted = true;

  for (const eventName of INTERACTION_EVENTS) {
    document.removeEventListener(eventName, onInteraction, { capture: true });
  }

  posthog.startSessionRecording();

  for (const event of buffer) {
    posthog.capture(event.event, event.properties);
  }
  buffer.length = 0;
}

export function initPostHog(key: string | undefined, host: string | undefined) {
  if (typeof window === 'undefined' || initialized || !key) return;

  for (const eventName of INTERACTION_EVENTS) {
    document.addEventListener(eventName, onInteraction, { capture: true });
  }

  posthog.init(key, {
    api_host: host,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: true,
    session_recording: {
      maskInputOptions: { password: true }
    },
    before_send: (event) => {
      if (hasInteracted) return event;
      if (event) buffer.push(event);
      return null;
    }
  });
  initialized = true;
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !initialized) return;
  posthog.capture(event, properties);
}

