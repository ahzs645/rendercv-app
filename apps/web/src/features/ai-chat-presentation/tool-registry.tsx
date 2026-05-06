import {
  BookOpen,
  Brain,
  Briefcase,
  FileText,
  Globe,
  Pencil,
  type LucideIcon
} from 'lucide-react';

const TOOL_ICONS: Record<string, LucideIcon> = {
  editYaml: Pencil,
  fetchUrl: Globe,
  readYaml: BookOpen,
  searchJobs: Briefcase,
  generateDocument: FileText
};

const TOOL_LABELS: Record<string, string> = {
  editYaml: 'Editing CV',
  fetchUrl: 'Fetching URL',
  readYaml: 'Reading file',
  searchJobs: 'Searching jobs',
  generateDocument: 'Generating document'
};

export function getToolIcon(name: string): LucideIcon {
  return TOOL_ICONS[name] ?? Brain;
}

export function getToolLabel(name: string): string {
  return TOOL_LABELS[name] ?? name;
}

