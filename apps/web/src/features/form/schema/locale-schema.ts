import type { SectionSchema } from './types.js';

export const localeSchema: SectionSchema = {
  groups: [
    {
      title: '',
      fields: [
        {
          path: ['last_updated'],
          label: 'Last Updated',
          type: 'string',
          placeholder: 'Last updated in'
        },
        { path: ['present'], label: 'Present', type: 'string', placeholder: 'present' },
        { path: ['month'], label: 'Month', type: 'string', placeholder: 'month' },
        { path: ['months'], label: 'Months', type: 'string', placeholder: 'months' },
        { path: ['year'], label: 'Year', type: 'string', placeholder: 'year' },
        { path: ['years'], label: 'Years', type: 'string', placeholder: 'years' }
      ]
    },
    {
      title: 'Phrases',
      fields: [
        {
          path: ['phrases', 'degree_with_area'],
          label: 'Degree with Area',
          type: 'string',
          placeholder: 'DEGREE in AREA',
          description: 'Use DEGREE and AREA as placeholders'
        }
      ]
    },
    {
      title: 'Month Abbreviations',
      fields: [
        {
          path: ['month_abbreviations', '0'],
          label: 'January',
          type: 'string',
          placeholder: 'Jan'
        },
        {
          path: ['month_abbreviations', '1'],
          label: 'February',
          type: 'string',
          placeholder: 'Feb'
        },
        { path: ['month_abbreviations', '2'], label: 'March', type: 'string', placeholder: 'Mar' },
        { path: ['month_abbreviations', '3'], label: 'April', type: 'string', placeholder: 'Apr' },
        { path: ['month_abbreviations', '4'], label: 'May', type: 'string', placeholder: 'May' },
        { path: ['month_abbreviations', '5'], label: 'June', type: 'string', placeholder: 'June' },
        { path: ['month_abbreviations', '6'], label: 'July', type: 'string', placeholder: 'July' },
        { path: ['month_abbreviations', '7'], label: 'August', type: 'string', placeholder: 'Aug' },
        {
          path: ['month_abbreviations', '8'],
          label: 'September',
          type: 'string',
          placeholder: 'Sept'
        },
        {
          path: ['month_abbreviations', '9'],
          label: 'October',
          type: 'string',
          placeholder: 'Oct'
        },
        {
          path: ['month_abbreviations', '10'],
          label: 'November',
          type: 'string',
          placeholder: 'Nov'
        },
        {
          path: ['month_abbreviations', '11'],
          label: 'December',
          type: 'string',
          placeholder: 'Dec'
        }
      ]
    },
    {
      title: 'Month Names',
      fields: [
        { path: ['month_names', '0'], label: 'January', type: 'string', placeholder: 'January' },
        { path: ['month_names', '1'], label: 'February', type: 'string', placeholder: 'February' },
        { path: ['month_names', '2'], label: 'March', type: 'string', placeholder: 'March' },
        { path: ['month_names', '3'], label: 'April', type: 'string', placeholder: 'April' },
        { path: ['month_names', '4'], label: 'May', type: 'string', placeholder: 'May' },
        { path: ['month_names', '5'], label: 'June', type: 'string', placeholder: 'June' },
        { path: ['month_names', '6'], label: 'July', type: 'string', placeholder: 'July' },
        { path: ['month_names', '7'], label: 'August', type: 'string', placeholder: 'August' },
        {
          path: ['month_names', '8'],
          label: 'September',
          type: 'string',
          placeholder: 'September'
        },
        { path: ['month_names', '9'], label: 'October', type: 'string', placeholder: 'October' },
        { path: ['month_names', '10'], label: 'November', type: 'string', placeholder: 'November' },
        { path: ['month_names', '11'], label: 'December', type: 'string', placeholder: 'December' }
      ]
    }
  ]
};
