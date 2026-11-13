import { afterEach, describe, expect, it } from 'vitest';
import {
  buildRenderFixPrompt,
  getRenderDiagnostics,
  setRenderDiagnostics
} from './render-fix-prompt';
import type { RenderError } from './use-viewer-renderer';

const design = [
  'design:',
  '  theme: ahmadstyle',
  '  website_link_color: lightblue',
  '  keep_entries_together: true',
  ''
].join('\n');

const cv = 'cv:\n  name: Ada Lovelace\n  sections: {}\n';

const colorError: RenderError = {
  message: "'lightblue' is not a color the 'ahmadstyle' theme can use.",
  schema_location: ['design', 'website_link_color'],
  input: 'lightblue',
  yaml_source: 'design',
  yaml_location: [
    [3, 3],
    [3, 21]
  ]
};

describe('buildRenderFixPrompt', () => {
  afterEach(() => setRenderDiagnostics({ errors: [], warnings: [], stale: false }));

  it('names the field, the offending value and quotes the section involved', () => {
    const prompt = buildRenderFixPrompt({
      errors: [colorError],
      sections: { cv, design, locale: '', settings: '' }
    });

    expect(prompt).toContain('[design]');
    expect(prompt).toContain('field design.website_link_color');
    expect(prompt).toContain('Offending value: lightblue');
    expect(prompt).toContain('Current design YAML (around line 3)');
    expect(prompt).toContain('website_link_color: lightblue');
    // The CV is not involved in this error, so it is not pasted.
    expect(prompt).not.toContain('Ada Lovelace');
  });

  it('includes the design for typesetting errors that carry no location', () => {
    const prompt = buildRenderFixPrompt({
      errors: [
        {
          message: 'Typesetting failed after validation: color string contains non-hexadecimal letters',
          schema_location: [],
          input: '',
          yaml_source: 'cv',
          yaml_location: null
        }
      ],
      sections: { cv, design, locale: '', settings: '' }
    });

    expect(prompt).toContain('non-hexadecimal');
    expect(prompt).toContain('Current design YAML:');
  });

  it('lists warnings alongside errors', () => {
    const prompt = buildRenderFixPrompt({
      errors: [colorError],
      warnings: ['Section experience: mapped `organization` → `company`.'],
      sections: { design }
    });

    expect(prompt).toContain('Warnings (rendered, but worth fixing):');
    expect(prompt).toContain('mapped `organization`');
  });

  it('shares the latest diagnostics with code outside React', () => {
    setRenderDiagnostics({ errors: [colorError], warnings: [], stale: true });
    expect(getRenderDiagnostics()).toMatchObject({ stale: true, errors: [colorError] });
  });
});
