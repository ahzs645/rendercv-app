import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { fileStore } from '@rendercv/core';
import { ApiRequestError, api } from '../lib/api';

const MAX_PDF_SIZE = 5 * 1024 * 1024;

function getPdfImportErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 402 || error.code === 'quota_exceeded') {
      return 'AI usage limit reached. Upgrade or wait for your quota to reset before importing another PDF.';
    }

    if (
      error.status === 400 ||
      error.code === 'invalid_pdf' ||
      error.code === 'incomplete_pdf' ||
      error.code === 'pdf_parse_error'
    ) {
      return 'This PDF could not be read. It may be corrupted, password-protected, or not a valid PDF file.';
    }

    if (error.status === 422) {
      return 'The PDF could not be converted into a valid CV. Try a simpler PDF or edit the imported content manually.';
    }

    if (error.status === 502) {
      return 'The AI could not extract content from this PDF. Please try a different file.';
    }
  }

  return error instanceof Error ? error.message : 'Failed to import PDF. Please try again.';
}

export function PdfImportButton({ mode = 'full' }: { mode?: 'full' | 'compact' | 'mini' }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const mini = mode === 'mini';
  const compact = mode === 'compact';

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
      toast.error(getPdfImportErrorMessage(error));
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
        className={`flex w-full items-center rounded-md border border-dashed border-sidebar-border transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
          mini ? 'h-10 justify-center px-0' : compact ? 'justify-start gap-2 px-3 py-2.5' : 'justify-start gap-3 px-3 py-3'
        }`}
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        title="Import from PDF"
        type="button"
      >
        <Upload className="size-4" />
        {mini ? (
          <span className="sr-only">{pending ? 'Importing PDF' : 'Import from PDF'}</span>
        ) : (
          <span className="min-w-0 text-left">
            <span className="block text-sm font-medium">
              {pending ? 'Importing PDF…' : 'Import from PDF'}
            </span>
            {!compact ? (
              <span className="block text-xs text-sidebar-foreground/60">
                Drag and drop is supported
              </span>
            ) : null}
          </span>
        )}
      </button>
    </>
  );
}
