import posthog from 'posthog-js';
import { browser } from '$app/environment';

let initialized = false;

// Ghost-session filter: buffer all events until a real user interaction.
// Bots that execute JS but never click/type generate zero network requests.
let hasInteracted = false;
const buffer: Array<{ event: string; properties?: Record<string, unknown> }> = [];

const INTERACTION_EVENTS = ['click', 'keydown', 'touchstart'] as const;

function onInteraction() {
  if (hasInteracted) return;
  hasInteracted = true;

  for (const evt of INTERACTION_EVENTS) {
    document.removeEventListener(evt, onInteraction, { capture: true });
  }

  posthog.startSessionRecording();

  for (const e of buffer) {
    posthog.capture(e.event, e.properties);
  }
  buffer.length = 0;
}

export function initPostHog(key: string, host: string) {
  if (!browser || initialized || !key) return;

  for (const evt of INTERACTION_EVENTS) {
    document.addEventListener(evt, onInteraction, { capture: true });
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
  if (!browser || !initialized) return;
  posthog.capture(event, properties);
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  if (!browser || !initialized) return;
  posthog.identify(userId, properties);
}

export function setPersonProperties(properties: Record<string, unknown>) {
  if (!browser || !initialized) return;
  posthog.setPersonProperties(properties);
}

export function reset() {
  if (!browser || !initialized) return;
  posthog.reset();
}
