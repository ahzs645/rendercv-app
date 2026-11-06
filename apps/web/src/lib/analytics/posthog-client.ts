import type { PostHog } from 'posthog-js';

type BufferedEvent = { event: string; properties?: Record<string, unknown> };

const INTERACTION_EVENTS = ['click', 'keydown', 'touchstart'] as const;

let posthog: PostHog | null = null;
let enabled = false;
let hasInteracted = false;
/** Events PostHog produced before the visitor interacted. */
const heldUntilInteraction: BufferedEvent[] = [];
/** Events the app captured while the library was still downloading. */
const heldUntilLoaded: BufferedEvent[] = [];

function onInteraction() {
  if (hasInteracted) return;
  hasInteracted = true;

  for (const eventName of INTERACTION_EVENTS) {
    document.removeEventListener(eventName, onInteraction, { capture: true });
  }

  posthog?.startSessionRecording();
  releaseHeldEvents();
}

function releaseHeldEvents() {
  if (!posthog || !hasInteracted) return;
  for (const { event, properties } of heldUntilInteraction.splice(0)) {
    posthog.capture(event, properties);
  }
}

/**
 * Analytics stay off without a key, and the library is only downloaded with
 * one: it is the largest dependency in the app. To turn them on, set the
 * VITE_POSTHOG_KEY and VITE_POSTHOG_HOST repository variables and redeploy.
 */
export function initPostHog(key: string | undefined, host: string | undefined) {
  if (typeof window === 'undefined' || enabled || !key) return;
  enabled = true;

  for (const eventName of INTERACTION_EVENTS) {
    document.addEventListener(eventName, onInteraction, { capture: true });
  }

  return import('posthog-js')
    .then(({ default: client }) => {
      client.init(key, {
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
          if (event) heldUntilInteraction.push(event);
          return null;
        }
      });
      posthog = client;
      if (hasInteracted) posthog.startSessionRecording();
      for (const { event, properties } of heldUntilLoaded.splice(0)) {
        posthog.capture(event, properties);
      }
      releaseHeldEvents();
    })
    .catch((error: unknown) => {
      // An ad blocker or a stale chunk must never take the app down with it.
      enabled = false;
      heldUntilLoaded.length = 0;
      console.warn('Analytics could not be loaded.', error);
    });
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !enabled) return;
  if (posthog) {
    posthog.capture(event, properties);
  } else {
    heldUntilLoaded.push({ event, properties });
  }
}
