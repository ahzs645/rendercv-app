import { describe, expect, it } from 'vitest';
import { formatRenderErrorMessage, summarizeRenderErrors } from './render-error-format';

describe('render error formatting', () => {
  it('formats generic unknown field errors with the field path and location', () => {
    expect(
      formatRenderErrorMessage({
        message: 'This field is unknown for this object. Please remove it.',
        schema_location: ['cv', 'linkedin'],
        yaml_source: 'cv',
        yaml_location: [
          [7, 3],
          [7, 12]
        ]
      })
    ).toBe('Unknown field cv.linkedin at line 7, column 3.');
  });

  it('appends field path and location for non-generic validation messages', () => {
    expect(
      formatRenderErrorMessage({
        message: 'Input should be a valid URL',
        schema_location: ['design', 'theme'],
        yaml_source: 'design',
        yaml_location: [
          [2, 3],
          [2, 7]
        ]
      })
    ).toBe('Input should be a valid URL (field design.theme; line 2, column 3)');
  });

  it('summarizes multiple errors for import toasts', () => {
    expect(
      summarizeRenderErrors([
        {
          message: 'This field is unknown for this object. Please remove it.',
          schema_location: ['cv', 'linkedin'],
          yaml_source: 'cv',
          yaml_location: [
            [7, 3],
            [7, 12]
          ]
        },
        {
          message: 'This field is unknown for this object. Please remove it.',
          schema_location: ['cv', 'address'],
          yaml_source: 'cv',
          yaml_location: [
            [8, 3],
            [8, 11]
          ]
        }
      ])
    ).toBe(
      'This file is not valid RenderCV YAML. Unknown field cv.linkedin at line 7, column 3. Unknown field cv.address at line 8, column 3.'
    );
  });
});
