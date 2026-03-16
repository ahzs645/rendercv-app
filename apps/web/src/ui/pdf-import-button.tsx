import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { fileStore } from '@rendercv/core';
import { api } from '../lib/api';

const MAX_PDF_SIZE = 5 * 1024 * 1024;

export function PdfImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function importFile(file: File) {
    if (file.type !== 'application/pdf') {
      toast.error('Choose a PDF file.');
      return;
    }

    if (file.size > MAX_PDF_SIZE) {
      toast.error('PDF must be 5 MB or smaller.');
      return;
    }

    setPending(true);
    try {
      const result = await api.importPdf(file);
      const name = file.name.replace(/\.pdf$/i, '') || 'Imported CV';
      fileStore.createFile(name, { cv: result.cv });
      toast.success('PDF imported into a new CV.');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import PDF.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        accept=".pdf,application/pdf"
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void importFile(file);
          }
        }}
      />
      <button
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-2.5 text-foreground"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <Upload className="size-4" />
        {pending ? 'Importing PDF…' : 'Import from PDF'}
      </button>
    </>
  );
}
