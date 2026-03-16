/**
 * UI-only typewriter effect for streaming chat messages.
 *
 * Buffers the full text from the AI SDK and reveals it progressively
 * via requestAnimationFrame. Speed adapts dynamically:
 *   - Large buffer → fast catch-up (many chars/frame)
 *   - Small buffer → slow drip (1-2 chars/frame), feels natural
 *   - Empty buffer → pauses until more text arrives
 */

const SMOOTHING = 12; // Higher = smoother but slower catch-up

export class Typewriter {
  #target = $state('');
  #displayed = $state('');
  #raf: number | undefined;
  #active = false;

  /** The progressively revealed text to render. */
  get displayed() {
    return this.#displayed;
  }

  /** Whether the typewriter is still revealing text. */
  get isRevealing() {
    return this.#displayed.length < this.#target.length;
  }

  /** Feed new target text (call reactively as streaming content grows). */
  set source(text: string) {
    this.#target = text;
    if (!this.#active) this.#start();
  }

  /** Instantly reveal all remaining text and stop. */
  flush() {
    this.#stop();
    this.#displayed = this.#target;
  }

  /** Reset to empty state. */
  reset() {
    this.#stop();
    this.#target = '';
    this.#displayed = '';
  }

  #start() {
    if (this.#active) return;
    this.#active = true;
    this.#raf = requestAnimationFrame(() => this.#tick());
  }

  #stop() {
    this.#active = false;
    if (this.#raf !== undefined) {
      cancelAnimationFrame(this.#raf);
      this.#raf = undefined;
    }
  }

  #tick() {
    if (!this.#active) return;

    const buffer = this.#target.length - this.#displayed.length;
    if (buffer <= 0) {
      // Nothing to reveal — pause until more text arrives via `source` setter
      this.#active = false;
      this.#raf = undefined;
      return;
    }

    const chars = Math.max(1, Math.ceil(buffer / SMOOTHING));
    this.#displayed = this.#target.slice(0, this.#displayed.length + chars);
    this.#raf = requestAnimationFrame(() => this.#tick());
  }
}
