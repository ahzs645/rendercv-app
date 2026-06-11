import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://rendercv.app',
  base: process.env.DOCS_BASE ?? '/docs',
  integrations: [
    starlight({
      title: 'RenderCV App Docs',
      description: 'User and developer documentation for the RenderCV web app.',
      logo: {
        src: './src/assets/logo.svg'
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/rendercv/rendercv'
        }
      ],
      sidebar: [
        {
          label: 'Start',
          items: [
            { label: 'Overview', slug: '' },
            { label: 'Quick Start', slug: 'quick-start' }
          ]
        },
        {
          label: 'Using the App',
          items: [
            { label: 'Workspace', slug: 'workspace' },
            { label: 'Editing CVs', slug: 'editing' },
            { label: 'Preview and Fit', slug: 'preview-and-fit' },
            { label: 'Themes and Locales', slug: 'themes-and-locales' },
            { label: 'Import and Migration', slug: 'import-and-migration' },
            { label: 'Exporting', slug: 'exporting' },
            { label: 'Sharing and Review', slug: 'sharing-and-review' },
            { label: 'AI Features', slug: 'ai-features' },
            { label: 'Keyboard Shortcuts', slug: 'keyboard-shortcuts' }
          ]
        },
        {
          label: 'Reference',
          items: [
            { label: 'Routes', slug: 'routes' },
            { label: 'Data Model', slug: 'data-model' },
            { label: 'Privacy and Data', slug: 'privacy-and-data' },
            { label: 'Troubleshooting', slug: 'troubleshooting' }
          ]
        },
        {
          label: 'Developers',
          items: [
            { label: 'Architecture', slug: 'developers/architecture' },
            { label: 'Local Development', slug: 'developers/local-development' },
            { label: 'API Reference', slug: 'developers/api-reference' },
            { label: 'Maintenance Notes', slug: 'developers/maintenance-notes' }
          ]
        }
      ],
      customCss: ['./src/styles/custom.css']
    })
  ]
});
