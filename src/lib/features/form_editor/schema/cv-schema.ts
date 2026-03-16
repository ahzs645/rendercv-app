import type { FieldGroup, EntryTemplate } from './types.js';

export const cvPersonalInfoGroup: FieldGroup = {
  title: '',
  fields: [
    { path: ['name'], label: 'Name', type: 'string', required: true, placeholder: 'John Doe' },
    { path: ['headline'], label: 'Headline', type: 'string', placeholder: 'Mechanical Engineer' },
    { path: ['location'], label: 'Location', type: 'string', placeholder: 'San Francisco, CA' },
    { path: ['email'], label: 'Email', type: 'string', placeholder: 'email@example.com' },
    { path: ['phone'], label: 'Phone', type: 'string', placeholder: '+1 555 123 4567' },
    { path: ['website'], label: 'Website', type: 'string', placeholder: 'https://' },
    { path: ['photo'], label: 'Photo URL', type: 'string', placeholder: 'https://' }
  ]
};

export const socialNetworkTemplate: EntryTemplate = {
  name: 'social_networks',
  label: 'Social Networks',
  singularLabel: 'Social Network',
  compact: true,
  fields: [
    {
      path: ['network'],
      label: 'Network',
      type: 'select',
      required: true,
      defaultValue: null,
      options: [
        { value: 'Bluesky', label: 'Bluesky' },
        { value: 'GitHub', label: 'GitHub' },
        { value: 'GitLab', label: 'GitLab' },
        { value: 'Google Scholar', label: 'Google Scholar' },
        { value: 'IMDB', label: 'IMDB' },
        { value: 'Instagram', label: 'Instagram' },
        { value: 'Leetcode', label: 'Leetcode' },
        { value: 'LinkedIn', label: 'LinkedIn' },
        { value: 'Mastodon', label: 'Mastodon' },
        { value: 'ORCID', label: 'ORCID' },
        { value: 'Reddit', label: 'Reddit' },
        { value: 'ResearchGate', label: 'ResearchGate' },
        { value: 'StackOverflow', label: 'StackOverflow' },
        { value: 'Telegram', label: 'Telegram' },
        { value: 'WhatsApp', label: 'WhatsApp' },
        { value: 'X', label: 'X' },
        { value: 'YouTube', label: 'YouTube' }
      ]
    },
    {
      path: ['username'],
      label: 'Username',
      type: 'string',
      required: true,
      defaultValue: null,
      preserveEmpty: true
    }
  ]
};

export const customConnectionTemplate: EntryTemplate = {
  name: 'custom_connections',
  label: 'Custom Connections',
  singularLabel: 'Custom Connection',
  compact: true,
  fields: [
    {
      path: ['fontawesome_icon'],
      label: 'FontAwesome Icon',
      type: 'string',
      required: true,
      defaultValue: '',
      placeholder: 'calendar-days (see fontawesome.com)'
    },
    {
      path: ['url'],
      label: 'URL',
      type: 'string',
      required: true,
      defaultValue: '',
      placeholder: 'https://cal.com/johndoe'
    },
    {
      path: ['placeholder'],
      label: 'Placeholder',
      type: 'string',
      required: true,
      defaultValue: '',
      placeholder: 'Book a call'
    }
  ]
};
