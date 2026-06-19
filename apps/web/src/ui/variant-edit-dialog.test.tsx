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

function seedFileWithVariant() {
  const file = fileStore.createFile('Dialog CV');
  const key = fileStore.createVariant(file.id, 'Academic')!;
  fileStore.updateVariant(file.id, key, {
    description: 'Research roles',
    tags: ['research']
  });
  return { id: file.id, key };
}

afterEach(() => {
  cleanup();
});

describe('VariantEditDialog', () => {
  it('seeds the form from the variant definition', () => {
    const { id, key } = seedFileWithVariant();
    render(
      <VariantEditDialog selectedFile={currentFile(id)} variantKey={key} onClose={() => {}} />
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Academic');
    expect(screen.getByLabelText('Description')).toHaveValue('Research roles');
    // Existing tag is shown as a removable chip.
    expect(screen.getByRole('button', { name: 'Remove research' })).toBeInTheDocument();

    fileStore.deleteFile(id);
  });

  it('adds a tag and saves it to the variant', () => {
    const { id, key } = seedFileWithVariant();
    const onClose = vi.fn();
    render(
      <VariantEditDialog selectedFile={currentFile(id)} variantKey={key} onClose={onClose} />
    );

    const tagInput = screen.getByTestId('variant-tags-input');
    fireEvent.change(tagInput, { target: { value: 'teaching' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(currentFile(id).variants?.[key]?.tags).toEqual(['research', 'teaching']);
    expect(onClose).toHaveBeenCalledOnce();

    fileStore.deleteFile(id);
  });

  it('renames the variant and patches it under the new key', () => {
    const { id, key } = seedFileWithVariant();
    render(
      <VariantEditDialog selectedFile={currentFile(id)} variantKey={key} onClose={() => {}} />
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Industry' } });
    fireEvent.change(screen.getByTestId('variant-flavors-input'), { target: { value: 'short' } });
    fireEvent.keyDown(screen.getByTestId('variant-flavors-input'), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    const file = currentFile(id);
    expect(file.variants?.academic).toBeUndefined();
    expect(file.variants?.industry).toMatchObject({
      description: 'Research roles',
      tags: ['research'],
      flavors: ['short']
    });

    fileStore.deleteFile(id);
  });
});
