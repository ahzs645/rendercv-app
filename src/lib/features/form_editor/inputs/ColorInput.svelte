<script lang="ts">
  import * as Popover from '$lib/ui/components/popover/index.js';
  import { cn } from '$lib/ui/utils.js';
  import FieldMessage from './FieldMessage.svelte';

  interface Props {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
    error?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable('#000000'),
    label,
    description,
    disabled,
    error,
    onchange
  }: Props = $props();

  let open = $state(false);

  // ── HSV state (internal picker representation) ──────────────────────
  let h = $state(0);
  let s = $state(0);
  let v = $state(0);

  type ColorMode = 'hex' | 'rgb' | 'hsl';
  let mode = $state<ColorMode>('hex');

  // Sync HSV + detect mode when popover opens
  $effect(() => {
    if (open) {
      mode = detectMode(value);
      const hsv = parseToHsv(value);
      h = hsv.h;
      s = hsv.s;
      v = hsv.v;
    }
  });

  function detectMode(val: string): ColorMode {
    if (/^hsl\(/i.test(val.trim())) return 'hsl';
    if (/^rgb\(/i.test(val.trim())) return 'rgb';
    return 'hex';
  }

  function parseToHsv(val: string): { h: number; s: number; v: number } {
    const trimmed = val.trim();

    // Try rgb(r, g, b)
    const rgbMatch = trimmed.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgbMatch) {
      return rgbToHsv(+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]);
    }

    // Try hsl(h, s%, l%)
    const hslMatch = trimmed.match(
      /^hsl\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%?\s*,\s*(\d+(?:\.\d+)?)%?\s*\)$/i
    );
    if (hslMatch) {
      return hslToHsv(+hslMatch[1], +hslMatch[2], +hslMatch[3]);
    }

    // Try hex
    const rgb = hexToRgb(trimmed);
    if (rgb) return rgbToHsv(rgb.r, rgb.g, rgb.b);

    return { h: 0, s: 0, v: 0 };
  }

  function formatValue(hue: number, sat: number, val: number, m: ColorMode): string {
    const rgb = hsvToRgb(hue, sat, val);
    if (m === 'rgb') return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    if (m === 'hsl') {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  function commitFromPicker() {
    value = formatValue(h, s, v, mode);
    onchange?.(value);
  }

  function switchMode(newMode: ColorMode) {
    mode = newMode;
    value = formatValue(h, s, v, newMode);
    onchange?.(value);
  }

  // ── Color conversion utilities ───────────────────────────────────────

  function hsvToRgb(hue: number, sat: number, val: number): { r: number; g: number; b: number } {
    const c = val * sat;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = val - c;
    let r = 0,
      g = 0,
      b = 0;
    if (hue < 60) {
      r = c;
      g = x;
    } else if (hue < 120) {
      r = x;
      g = c;
    } else if (hue < 180) {
      g = c;
      b = x;
    } else if (hue < 240) {
      g = x;
      b = c;
    } else if (hue < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let hue = 0;
    if (d !== 0) {
      if (max === rn) hue = ((gn - bn) / d + 6) % 6;
      else if (max === gn) hue = (bn - rn) / d + 2;
      else hue = (rn - gn) / d + 4;
      hue *= 60;
    }
    return { h: hue, s: max === 0 ? 0 : d / max, v: max };
  }

  function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    const d = max - min;
    let hue = 0;
    let sat = 0;
    if (d !== 0) {
      sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rn) hue = ((gn - bn) / d + 6) % 6;
      else if (max === gn) hue = (bn - rn) / d + 2;
      else hue = (rn - gn) / d + 4;
      hue *= 60;
    }
    return { h: Math.round(hue), s: Math.round(sat * 100), l: Math.round(l * 100) };
  }

  function hslToHsv(hue: number, sat: number, lig: number): { h: number; s: number; v: number } {
    const sn = sat / 100;
    const ln = lig / 100;
    const val = ln + sn * Math.min(ln, 1 - ln);
    return { h: hue, s: val === 0 ? 0 : 2 * (1 - ln / val), v: val };
  }

  function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = hex.match(/^#?([0-9a-f]{3,8})$/i);
    if (!m) return null;
    let raw = m[1];
    if (raw.length === 3) raw = raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2];
    if (raw.length < 6) return null;
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16)
    };
  }

  // ── Pointer drag helpers ─────────────────────────────────────────────

  let draggingArea = $state(false);
  let draggingHue = $state(false);

  function handleAreaPointer(e: PointerEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    commitFromPicker();
  }

  function handleHuePointer(e: PointerEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
    commitFromPicker();
  }

  // ── Inline input parsing (handles any format typed in row) ──────────

  function handleInlineInput(text: string) {
    value = text;
    onchange?.(value);
    const hsv = parseToHsv(text);
    // Only update picker if the text is a valid color
    if (hexToRgb(text) || /^rgb\(/i.test(text.trim()) || /^hsl\(/i.test(text.trim())) {
      h = hsv.h;
      s = hsv.s;
      v = hsv.v;
    }
  }
</script>

<div class="flex items-center py-1.5">
  <span
    class="shrink-0 text-xs {error ? 'text-destructive' : 'text-muted-foreground'}"
    style:width="var(--label-width, 8rem)"
  >
    {label}
  </span>
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          class="size-5 shrink-0 cursor-pointer rounded-full border border-border/60 disabled:cursor-not-allowed disabled:opacity-50"
          style:background-color={value}
          {disabled}
          aria-label="Pick color"
        >
        </button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-56 p-3" align="start">
      <!-- Saturation / Value area -->
      <div
        class="relative h-36 w-full cursor-crosshair rounded"
        style:background-color="hsl({h}, 100%, 50%)"
        onpointerdown={(e) => {
          draggingArea = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          handleAreaPointer(e);
        }}
        onpointermove={(e) => draggingArea && handleAreaPointer(e)}
        onpointerup={() => (draggingArea = false)}
        role="slider"
        aria-label="Color saturation and brightness"
        aria-valuenow={Math.round(s * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext="Saturation {Math.round(s * 100)}%, Brightness {Math.round(v * 100)}%"
        tabindex={0}
      >
        <div
          class="absolute inset-0 rounded"
          style:background="linear-gradient(to right, white, transparent)"
        ></div>
        <div
          class="absolute inset-0 rounded"
          style:background="linear-gradient(to bottom, transparent, black)"
        ></div>
        <div
          class="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
          style:left="{s * 100}%"
          style:top="{(1 - v) * 100}%"
        ></div>
      </div>

      <!-- Hue slider -->
      <div
        class="relative mt-2.5 h-3 w-full cursor-pointer rounded-full"
        style:background="linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"
        onpointerdown={(e) => {
          draggingHue = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          handleHuePointer(e);
        }}
        onpointermove={(e) => draggingHue && handleHuePointer(e)}
        onpointerup={() => (draggingHue = false)}
        role="slider"
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(h)}
        tabindex={0}
      >
        <div
          class="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
          style:left="{(h / 360) * 100}%"
          style:background-color="hsl({h}, 100%, 50%)"
        ></div>
      </div>

      <!-- Mode switcher -->
      <div class="mt-2.5 flex gap-1">
        {#each ['hex', 'rgb', 'hsl'] as m (m)}
          <button
            type="button"
            class={cn(
              'h-5 flex-1 rounded text-[10px] font-medium uppercase',
              mode === m
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            onclick={() => switchMode(m as ColorMode)}
          >
            {m}
          </button>
        {/each}
      </div>

      <!-- Format-specific inputs -->
      <div class="mt-1.5">
        {#if mode === 'hex'}
          <input
            type="text"
            {value}
            oninput={(e) => handleInlineInput(e.currentTarget.value)}
            class="w-full rounded border border-border/60 bg-transparent px-2 py-1.5 font-mono text-xs outline-none"
            placeholder="#000000"
          />
        {:else if mode === 'rgb'}
          {@const rgb = hsvToRgb(h, s, v)}
          <div class="flex gap-1">
            <div class="relative flex-1">
              <input
                type="number"
                min={0}
                max={255}
                value={rgb.r}
                oninput={(e) => {
                  const hsv = rgbToHsv(+e.currentTarget.value, rgb.g, rgb.b);
                  h = hsv.h;
                  s = hsv.s;
                  v = hsv.v;
                  commitFromPicker();
                }}
                class="w-full [appearance:textfield] rounded border border-border/60 bg-transparent px-2 py-1.5 text-center font-mono text-xs outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div
                class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-popover px-1 text-[9px] text-muted-foreground"
              >
                R
              </div>
            </div>
            <div class="relative flex-1">
              <input
                type="number"
                min={0}
                max={255}
                value={rgb.g}
                oninput={(e) => {
                  const hsv = rgbToHsv(rgb.r, +e.currentTarget.value, rgb.b);
                  h = hsv.h;
                  s = hsv.s;
                  v = hsv.v;
                  commitFromPicker();
                }}
                class="w-full [appearance:textfield] rounded border border-border/60 bg-transparent px-2 py-1.5 text-center font-mono text-xs outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div
                class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-popover px-1 text-[9px] text-muted-foreground"
              >
                G
              </div>
            </div>
            <div class="relative flex-1">
              <input
                type="number"
                min={0}
                max={255}
                value={rgb.b}
                oninput={(e) => {
                  const hsv = rgbToHsv(rgb.r, rgb.g, +e.currentTarget.value);
                  h = hsv.h;
                  s = hsv.s;
                  v = hsv.v;
                  commitFromPicker();
                }}
                class="w-full [appearance:textfield] rounded border border-border/60 bg-transparent px-2 py-1.5 text-center font-mono text-xs outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div
                class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-popover px-1 text-[9px] text-muted-foreground"
              >
                B
              </div>
            </div>
          </div>
        {:else}
          {@const hsl = rgbToHsl(...(Object.values(hsvToRgb(h, s, v)) as [number, number, number]))}
          <div class="flex gap-1">
            <div class="relative flex-1">
              <input
                type="number"
                min={0}
                max={360}
                value={hsl.h}
                oninput={(e) => {
                  const hsv = hslToHsv(+e.currentTarget.value, hsl.s, hsl.l);
                  h = hsv.h;
                  s = hsv.s;
                  v = hsv.v;
                  commitFromPicker();
                }}
                class="w-full [appearance:textfield] rounded border border-border/60 bg-transparent px-2 py-1.5 text-center font-mono text-xs outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div
                class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-popover px-1 text-[9px] text-muted-foreground"
              >
                H
              </div>
            </div>
            <div class="relative flex-1">
              <input
                type="number"
                min={0}
                max={100}
                value={hsl.s}
                oninput={(e) => {
                  const hsv = hslToHsv(hsl.h, +e.currentTarget.value, hsl.l);
                  h = hsv.h;
                  s = hsv.s;
                  v = hsv.v;
                  commitFromPicker();
                }}
                class="w-full [appearance:textfield] rounded border border-border/60 bg-transparent px-2 py-1.5 text-center font-mono text-xs outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div
                class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-popover px-1 text-[9px] text-muted-foreground"
              >
                S
              </div>
            </div>
            <div class="relative flex-1">
              <input
                type="number"
                min={0}
                max={100}
                value={hsl.l}
                oninput={(e) => {
                  const hsv = hslToHsv(hsl.h, hsl.s, +e.currentTarget.value);
                  h = hsv.h;
                  s = hsv.s;
                  v = hsv.v;
                  commitFromPicker();
                }}
                class="w-full [appearance:textfield] rounded border border-border/60 bg-transparent px-2 py-1.5 text-center font-mono text-xs outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div
                class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-popover px-1 text-[9px] text-muted-foreground"
              >
                L
              </div>
            </div>
          </div>
        {/if}
      </div>
    </Popover.Content>
  </Popover.Root>
  <input
    type="text"
    bind:value
    oninput={() => onchange?.(value)}
    {disabled}
    placeholder="#000000"
    class="ml-2 min-w-0 flex-1 bg-transparent py-0.5 font-mono text-sm outline-none select-text placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
  />
</div>
<FieldMessage {error} {description} />
