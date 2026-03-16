import type { SectionSchema } from './types.js';

export const settingsSchema: SectionSchema = {
  groups: [
    {
      title: 'General',
      fields: [
        {
          path: ['current_date'],
          label: 'Current Date',
          type: 'string',
          placeholder: 'today'
        },
        {
          path: ['bold_keywords'],
          label: 'Bold Keywords',
          type: 'string_list',
          placeholder: 'Add a keyword',
          ordered: false
        },
        {
          path: ['pdf_title'],
          label: 'PDF Title',
          type: 'string',
          placeholder: 'NAME - CV'
        }
      ]
    }
  ]
};
