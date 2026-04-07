export type SelectOption = {
  value: string;
  label: string;
  icon?: unknown;
  extra?: string;
};

export type FieldType =
  | 'string'
  | 'boolean'
  | 'select'
  | 'date'
  | 'dimension'
  | 'color'
  | 'font'
  | 'bullet'
  | 'alignment'
  | 'section_style'
  | 'string_list'
  | 'toggle';

export interface FieldDef {
  path: string[];
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: unknown;
  preserveEmpty?: boolean;
  ordered?: boolean;
  options?: string | SelectOption[];
  bullets?: string[];
  fonts?: string[];
}

export interface FieldGroup {
  title: string;
  fields: FieldDef[];
}

export interface SectionSchema {
  groups: FieldGroup[];
}

export interface EntryTemplate {
  name: string;
  label: string;
  singularLabel?: string;
  compact?: boolean;
  fields: FieldDef[];
}
