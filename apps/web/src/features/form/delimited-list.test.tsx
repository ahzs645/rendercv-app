import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { FieldControl } from './field-controls';
import { oneLineTemplate } from './schema/entry-templates';
import { joinDelimitedList, splitDelimitedList } from './utils';

const detailsField = oneLineTemplate.fields.find((field) => field.path[0] === 'details')!;

// The suite does not run with `globals: true`, so RTL never registers its own
// afterEach cleanup and rendered trees would otherwise stack up.
afterEach(cleanup);

function DetailsEditor({ initial, onCommit }: { initial: string; onCommit: (v: unknown) => void }) {
  const [value, setValue] = useState<unknown>(initial);
  return (
    <FieldControl
      field={detailsField}
      value={value}
      onChange={(next) => {
        setValue(next);
        onCommit(next);
      }}
    />
  );
}

describe('splitDelimitedList / joinDelimitedList', () => {
  it('splits on the delimiter and trims each item', () => {
    expect(splitDelimitedList('OFA Level 1; TCPS 2; EPt')).toEqual([
      'OFA Level 1',
      'TCPS 2',
      'EPt'
    ]);
  });

  it('treats a blank string as no items', () => {
    expect(splitDelimitedList('')).toEqual([]);
    expect(splitDelimitedList('   ')).toEqual([]);
    expect(splitDelimitedList(undefined)).toEqual([]);
  });

  it('keeps interior blanks visible so a stray separator can be removed', () => {
    expect(splitDelimitedList('A;; B')).toEqual(['A', '', 'B']);
  });

  it('drops blanks when joining so the YAML never gets a dangling separator', () => {
    expect(joinDelimitedList(['A', '', 'B'])).toBe('A; B');
    expect(joinDelimitedList([''])).toBe('');
    expect(joinDelimitedList([])).toBe('');
  });

  it('round-trips a normal value unchanged', () => {
    const text = 'Power BI; GIS; R Studio';
    expect(joinDelimitedList(splitDelimitedList(text))).toBe(text);
  });

  it('normalizes spacing around the delimiter', () => {
    expect(joinDelimitedList(splitDelimitedList('A;B ;  C'))).toBe('A; B; C');
  });
});

describe('one-line entry details editor', () => {
  it('renders each detail as its own row', () => {
    render(<DetailsEditor initial="OFA Level 1; TCPS 2" onCommit={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.map((input) => (input as HTMLTextAreaElement).value)).toEqual([
      'OFA Level 1',
      'TCPS 2'
    ]);
  });

  it('commits a single delimited string, not a list', () => {
    const onCommit = vi.fn();
    render(<DetailsEditor initial="OFA Level 1; TCPS 2" onCommit={onCommit} />);

    fireEvent.change(screen.getAllByRole('textbox')[1]!, { target: { value: 'TCPS 2 (2027)' } });

    expect(onCommit).toHaveBeenLastCalledWith('OFA Level 1; TCPS 2 (2027)');
  });

  it('keeps a newly added empty row visible even though it is not written out', () => {
    const onCommit = vi.fn();
    render(<DetailsEditor initial="OFA Level 1" onCommit={onCommit} />);

    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(onCommit).toHaveBeenLastCalledWith('OFA Level 1');

    fireEvent.change(screen.getAllByRole('textbox')[1]!, { target: { value: 'TCPS 2' } });
    expect(onCommit).toHaveBeenLastCalledWith('OFA Level 1; TCPS 2');
  });

  it('removes a single item without touching the others', () => {
    const onCommit = vi.fn();
    render(<DetailsEditor initial="A; B; C" onCommit={onCommit} />);

    fireEvent.click(screen.getAllByRole('button', { name: /remove/i })[1]!);

    expect(onCommit).toHaveBeenLastCalledWith('A; C');
  });

  it('does not offer flavors, which cannot be stored in a scalar field', () => {
    render(<DetailsEditor initial="A; B" onCommit={vi.fn()} />);

    expect(screen.queryByTitle('Add flavor variants')).toBeNull();
  });
});
