import {
  bulletTemplate,
  educationTemplate,
  experienceTemplate,
  normalTemplate,
  oneLineTemplate,
  publicationTemplate
} from './schema/entry-templates';
import type { EntryTemplate } from './schema/types';

export type SectionPresetEntryKind =
  | 'text'
  | EntryTemplate['name'];

export interface SectionPreset {
  id: string;
  title: string;
  description: string;
  entryKind: SectionPresetEntryKind;
}

export const SECTION_PRESETS: readonly SectionPreset[] = [
  {
    id: 'experience',
    title: 'Experience',
    description: 'Roles with company, dates, and highlights.',
    entryKind: experienceTemplate.name
  },
  {
    id: 'education',
    title: 'Education',
    description: 'Institutions, degrees, dates.',
    entryKind: educationTemplate.name
  },
  {
    id: 'projects',
    title: 'Projects',
    description: 'Named projects with dates and highlights.',
    entryKind: normalTemplate.name
  },
  {
    id: 'publications',
    title: 'Publications',
    description: 'Papers with authors, journal, DOI.',
    entryKind: publicationTemplate.name
  },
  {
    id: 'skills',
    title: 'Skills',
    description: 'Grouped one-line skill rows (Languages: …).',
    entryKind: oneLineTemplate.name
  },
  {
    id: 'awards',
    title: 'Awards',
    description: 'Honors and recognitions.',
    entryKind: oneLineTemplate.name
  },
  {
    id: 'certifications',
    title: 'Certifications',
    description: 'Credentials with issuer and date.',
    entryKind: oneLineTemplate.name
  },
  {
    id: 'languages',
    title: 'Languages',
    description: 'Spoken languages with proficiency.',
    entryKind: oneLineTemplate.name
  },
  {
    id: 'volunteering',
    title: 'Volunteering',
    description: 'Service roles with dates and impact.',
    entryKind: experienceTemplate.name
  },
  {
    id: 'speaking',
    title: 'Speaking',
    description: 'Talks and presentations.',
    entryKind: normalTemplate.name
  },
  {
    id: 'patents',
    title: 'Patents',
    description: 'Patents with title and dates.',
    entryKind: normalTemplate.name
  },
  {
    id: 'interests',
    title: 'Interests',
    description: 'Simple bullet list.',
    entryKind: bulletTemplate.name
  }
];
