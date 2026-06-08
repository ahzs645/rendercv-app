import { describe, expect, it } from 'vitest';
import { cvYamlToJson, cvYamlToMarkdown } from './format-exports';

describe('cvYamlToJson', () => {
  it('converts YAML to JSON', () => {
    const yaml = 'name: John Doe\nheadline: Engineer\n';
    const json = JSON.parse(cvYamlToJson(yaml));
    expect(json).toEqual({ name: 'John Doe', headline: 'Engineer' });
  });
});

describe('cvYamlToMarkdown', () => {
  it('renders header, contact, and sections', () => {
    const yaml = `name: John Doe
headline: Software Engineer
location: Remote
email: john@example.com
website: https://johndoe.dev
social_networks:
  - network: GitHub
    username: johndoe
sections:
  experience:
    - company: Acme
      position: Engineer
      start_date: 2020-01
      end_date: 2024-01
      location: SF
      summary: Built things.
      highlights:
        - Shipped X
        - Improved Y
  publications:
    - title: A Paper
      authors:
        - John Doe
        - Jane Doe
      journal: Nature
      date: 2023
      doi: 10.1234/ab
  skills:
    - label: Languages
      details: TypeScript, Python
  bullet_section:
    - bullet: I like turtles
`;

    const md = cvYamlToMarkdown(yaml);

    expect(md).toContain('# John Doe');
    expect(md).toContain('_Software Engineer_');
    expect(md).toContain('Remote · john@example.com · https://johndoe.dev · GitHub: johndoe');
    expect(md).toContain('## Experience');
    expect(md).toContain('### Acme — Engineer');
    expect(md).toContain('_2020-01 – 2024-01 · SF_');
    expect(md).toContain('- Shipped X');
    expect(md).toContain('## Publications');
    expect(md).toContain('### A Paper');
    expect(md).toContain('DOI: 10.1234/ab');
    expect(md).toContain('John Doe, Jane Doe');
    expect(md).toContain('## Skills');
    expect(md).toContain('- **Languages:** TypeScript, Python');
    expect(md).toContain('- I like turtles');
  });

  it('accepts nested cv key', () => {
    const yaml = 'cv:\n  name: Jane\n  sections:\n    x:\n      - bullet: hi\n';
    const md = cvYamlToMarkdown(yaml);
    expect(md).toContain('# Jane');
    expect(md).toContain('## X');
    expect(md).toContain('- hi');
  });

  it('handles empty CV', () => {
    expect(() => cvYamlToMarkdown('')).not.toThrow();
  });
});
