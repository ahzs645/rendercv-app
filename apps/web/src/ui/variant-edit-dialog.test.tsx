import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CvFile } from '@rendercv/contracts';
import { fileStore } from '@rendercv/core';
import { VariantEditDialog } from './section-tabs';

function currentFile(id: string): CvFile {
  const file = fileStore.getSnapshot().files.find((entry) => entry.id === id);
  if (!file) {
    throw new Error('file not found');
  }
  return file;
}

function seedVariant(name = 'Academic') {
  const file = fileStore.createFile('Dialog CV');
  const key = fileStore.createVariant(file.id, name)!;
  fileStore.updateVariant(file.id, key, { description: 'Research roles', tags: ['research'] });
  return { id: file.id, key };
}

function variantsOf(id: string) {
  return currentFile(id).variants ?? {};
}

afterEach(cleanup);

describe('VariantEditDialog', () => {
  it('seeds the form from the variant definition', () => {
    const { id, key } = seedVariant();
    render(<VariantEditDialog selectedFile={currentFile(id)} variantKey={key} onClose={() => {}} />);

    expect(screen.getByTestId('variant-name-input')).toHaveValue('Academic');
    expect(screen.getByTestId('variant-description-input')).toHaveValue('Research roles');
    expect(screen.getByRole('button', { name: 'Remove research' })).toBeInTheDocument();

    fileStore.deleteFile(id);
  });

  it('saves added tags and flavors onto the variant', () => {
    const { id, key } = seedVariant();
    const onClose = vi.fn();
    render(<VariantEditDialog selectedFile={currentFile(id)} variantKey={key} onClose={onClose} />);

    fireEvent.change(screen.getByTestId('variant-tags-input'), { target: { value: 'teaching' } });
    fireEvent.keyDown(screen.getByTestId('variant-tags-input'), { key: 'Enter' });
    fireEvent.change(screen.getByTestId('variant-flavors-input'), { target: { value: 'short' } });
    fireEvent.keyDown(screen.getByTestId('variant-flavors-input'), { key: 'Enter' });
    fireEvent.click(screen.getByTestId('variant-edit-save'));

    expect(variantsOf(id)[key]).toMatchObject({ tags: ['research', 'teaching'], flavors: ['short'] });
    expect(onClose).toHaveBeenCalled();

    fileStore.deleteFile(id);
  });

  it('renames the variant and writes the edits under the new key', () => {
    const { id, key } = seedVariant();
    render(<VariantEditDialog selectedFile={currentFile(id)} variantKey={key} onClose={() => {}} />);

    fireEvent.change(screen.getByTestId('variant-name-input'), { target: { value: 'Industry' } });
    fireEvent.change(screen.getByTestId('variant-description-input'), { target: { value: 'Industry roles' } });
    fireEvent.click(screen.getByTestId('variant-edit-save'));

    const variants = variantsOf(id);
    expect(variants[key]).toBeUndefined();
    expect(variants.industry).toMatchObject({ description: 'Industry roles' });

    fileStore.deleteFile(id);
  });

  it('keeps the dialog open when the new name collides with another variant', () => {
    const { id, key } = seedVariant();
    fileStore.createVariant(id, 'Industry');
    const onClose = vi.fn();
    render(<VariantEditDialog selectedFile={currentFile(id)} variantKey={key} onClose={onClose} />);

    fireEvent.change(screen.getByTestId('variant-name-input'), { target: { value: 'Industry' } });
    fireEvent.click(screen.getByTestId('variant-edit-save'));

    // The rename was rejected, so nothing is written and the user stays put.
    expect(variantsOf(id)[key]).toMatchObject({ description: 'Research roles' });
    expect(onClose).not.toHaveBeenCalled();

    fileStore.deleteFile(id);
  });

  it('clears a description down to undefined rather than an empty string', () => {
    const { id, key } = seedVariant();
    render(<VariantEditDialog selectedFile={currentFile(id)} variantKey={key} onClose={() => {}} />);

    fireEvent.change(screen.getByTestId('variant-description-input'), { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('variant-edit-save'));

    expect(variantsOf(id)[key].description).toBeUndefined();

    fileStore.deleteFile(id);
  });
});

describe('TokenInput', () => {
  it('splits a comma-separated paste and ignores duplicates', () => {
    const { id, key } = seedVariant();
    render(<VariantEditDialog selectedFile={currentFile(id)} variantKey={key} onClose={() => {}} />);

    fireEvent.change(screen.getByTestId('variant-tags-input'), {
      target: { value: 'teaching, research, grants' }
    });
    fireEvent.keyDown(screen.getByTestId('variant-tags-input'), { key: 'Enter' });
    fireEvent.click(screen.getByTestId('variant-edit-save'));

    expect(variantsOf(id)[key].tags).toEqual(['research', 'teaching', 'grants']);

    fileStore.deleteFile(id);
  });

  it('pops the last chip on backspace with an empty draft', () => {
    const { id, key } = seedVariant();
    render(<VariantEditDialog selectedFile={currentFile(id)} variantKey={key} onClose={() => {}} />);

    fireEvent.keyDown(screen.getByTestId('variant-tags-input'), { key: 'Backspace' });
    fireEvent.click(screen.getByTestId('variant-edit-save'));

    expect(variantsOf(id)[key].tags).toBeUndefined();

    fileStore.deleteFile(id);
  });
});
