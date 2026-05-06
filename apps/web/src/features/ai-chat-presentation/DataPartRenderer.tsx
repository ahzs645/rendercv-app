import { Download, FileText } from 'lucide-react';

interface GeneratedDocumentData {
  filename?: string;
  label?: string;
  content?: string;
  mediaType?: string;
}

function downloadText(filename: string, content: string, mediaType: string) {
  const blob = new Blob([content], { type: mediaType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function isGeneratedDocument(data: unknown): data is GeneratedDocumentData {
  return Boolean(data && typeof data === 'object' && typeof (data as GeneratedDocumentData).content === 'string');
}

export function DataPartRenderer({ partType, data }: { partType: string; data: unknown }) {
  if (partType !== 'data-document' || !isGeneratedDocument(data)) {
    return null;
  }

  const filename = data.filename ?? 'Generated_Document.typ';
  const mediaType = data.mediaType ?? 'text/plain;charset=utf-8';

  return (
    <div className="my-2 rounded-xl border border-border bg-background p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate font-medium">{data.label ?? 'Generated document'}</p>
            <p className="truncate text-xs text-muted-foreground">{filename}</p>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"
          onClick={() => downloadText(filename, data.content!, mediaType)}
          type="button"
        >
          <Download className="size-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}

