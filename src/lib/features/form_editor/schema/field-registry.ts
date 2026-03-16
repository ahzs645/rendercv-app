/**
 * Field type → component registry.
 *
 * Maps each FieldType to the Svelte input component it should render,
 * a sensible default value, and any type-specific extra props.
 * This keeps all rendering knowledge in the schema layer so that
 * FieldRenderer.svelte is just a dumb pass-through.
 */

import type { Component } from 'svelte';
import type { FieldDef, FieldType } from './types.js';
import {
  StringInput,
  BooleanInput,
  SelectInput,
  DimensionInput,
  ColorInput,
  SectionStylePickerInput,
  StringListInput,
  ToggleInput
} from '../inputs/index.js';
import AlignLeftIcon from '@lucide/svelte/icons/align-left';
import AlignCenterIcon from '@lucide/svelte/icons/align-center';
import AlignRightIcon from '@lucide/svelte/icons/align-right';
import AlignJustifyIcon from '@lucide/svelte/icons/align-justify';

const DEFAULT_BULLETS = ['●', '•', '◦', '-', '◆', '★', '■', '—', '○'];

const TEXT_ALIGNMENTS = [
  { value: 'left', label: 'Left', icon: AlignLeftIcon },
  { value: 'justified', label: 'Justified', icon: AlignJustifyIcon },
  {
    value: 'justified-with-no-hyphenation',
    label: 'No hyphenation',
    icon: AlignJustifyIcon,
    extra: 'no-hyphenation'
  }
];

const POSITION_ALIGNMENTS = [
  { value: 'left', label: 'Left', icon: AlignLeftIcon },
  { value: 'center', label: 'Center', icon: AlignCenterIcon },
  { value: 'right', label: 'Right', icon: AlignRightIcon }
];

const ALIGNMENT_PRESETS: Record<string, typeof TEXT_ALIGNMENTS> = {
  position: POSITION_ALIGNMENTS
};

const DEFAULT_FONTS = [
  'DejaVu Sans Mono',
  'EB Garamond',
  'Fontin',
  'Gentium Book Plus',
  'Lato',
  'Libertinus Serif',
  'Mukta',
  'New Computer Modern',
  'Noto Sans',
  'Open Sans',
  'Open Sauce Sans',
  'Poppins',
  'Raleway',
  'Roboto',
  'Source Sans 3',
  'Ubuntu',
  'XCharter'
];

interface FieldRegistryEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: Component<any>;
  defaultValue: unknown;
  extraProps?: (field: FieldDef) => Record<string, unknown>;
}

const registry: Record<FieldType, FieldRegistryEntry> = {
  string: {
    component: StringInput,
    defaultValue: '',
    extraProps: (f) => ({ placeholder: (f as { placeholder?: string }).placeholder })
  },
  boolean: { component: BooleanInput, defaultValue: false },
  select: {
    component: SelectInput,
    defaultValue: '',
    extraProps: (f) => ({ options: (f as { options: unknown }).options })
  },
  toggle: {
    component: ToggleInput,
    defaultValue: '',
    extraProps: (f) => ({ options: (f as { options: unknown }).options })
  },
  dimension: { component: DimensionInput, defaultValue: '0cm' },
  color: { component: ColorInput, defaultValue: '#000000' },
  font: {
    component: SelectInput,
    defaultValue: '',
    extraProps: (f) => ({
      options: ((f as { fonts?: string[] }).fonts ?? DEFAULT_FONTS).map((font) => ({
        value: font,
        label: font
      }))
    })
  },
  bullet: {
    component: ToggleInput,
    defaultValue: '•',
    extraProps: (f) => ({
      options: ((f as { bullets?: string[] }).bullets ?? DEFAULT_BULLETS).map((b) => ({
        value: b,
        label: b
      })),
      square: true
    })
  },
  alignment: {
    component: ToggleInput,
    defaultValue: 'justified',
    extraProps: (f) => {
      const preset = (f as { options?: string }).options;
      return { options: preset ? (ALIGNMENT_PRESETS[preset] ?? TEXT_ALIGNMENTS) : TEXT_ALIGNMENTS };
    }
  },
  section_style: { component: SectionStylePickerInput, defaultValue: 'with_full_line' },
  string_list: {
    component: StringListInput,
    defaultValue: [],
    extraProps: (f) => ({
      placeholder: (f as { placeholder?: string }).placeholder,
      ordered: (f as { ordered?: boolean }).ordered
    })
  }
};

export function resolveField(field: FieldDef): FieldRegistryEntry {
  return registry[field.type];
}
