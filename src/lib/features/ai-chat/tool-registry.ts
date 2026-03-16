import PencilIcon from '@lucide/svelte/icons/pencil';
import GlobeIcon from '@lucide/svelte/icons/globe';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import BrainIcon from '@lucide/svelte/icons/brain';
import type { Component } from 'svelte';

export const TOOL_ICONS: Record<string, Component> = {
  editYaml: PencilIcon,
  fetchUrl: GlobeIcon,
  readYaml: BookOpenIcon
};

export const TOOL_LABELS: Record<string, string> = {
  editYaml: 'Editing CV',
  fetchUrl: 'Fetching URL',
  readYaml: 'Reading file'
};

export function getToolIcon(name: string): Component {
  return TOOL_ICONS[name] ?? BrainIcon;
}

export function getToolLabel(name: string): string {
  return TOOL_LABELS[name] ?? name;
}
