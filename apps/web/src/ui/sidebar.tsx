import { Copy, Eye, FilePlus2, Files, FolderArchive, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fileStore } from '@rendercv/core';
import type { CvFile } from '@rendercv/contracts';
import { useStore } from '../lib/use-store';
import { GitHubSyncCard } from './github-sync-card';
import { PdfImportButton } from './pdf-import-button';

export function Sidebar() {
  const snapshot = useStore(fileStore);
  const activeFiles = snapshot.files
    .filter((file) => !file.isArchived && !file.isTrashed)
    .sort((left, right) => right.lastEdited - left.lastEdited);

  return (
    <aside className="flex h-full flex-col border-r border-border bg-sidebar">
      <div className="border-b border-border p-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-primary-foreground" onClick={() => fileStore.createFile()}>
          <FilePlus2 className="size-4" />
          New CV
        </button>
        <div className="mt-3">
          <PdfImportButton />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <ul className="space-y-2">
          {activeFiles.map((file) => (
            <li key={file.id}>
              <SidebarFile file={file} selected={snapshot.selectedFileId === file.id} />
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-4">
          <GitHubSyncCard />
          <nav className="rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Links
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link className="text-foreground hover:underline" to="/pricing">
                Pricing
              </Link>
              <Link className="text-foreground hover:underline" to="/privacy-policy">
                Privacy Policy
              </Link>
              <Link className="text-foreground hover:underline" to="/terms-of-service">
                Terms of Service
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
}

function SidebarFile({ file, selected }: { file: CvFile; selected: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${selected ? 'border-primary bg-card' : 'border-transparent bg-card/60'}`}>
      <button className="w-full text-left" onClick={() => fileStore.selectFile(file.id)}>
        <p className="font-medium">{file.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {file.selectedTheme} · {file.selectedLocale}
        </p>
      </button>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <ActionButton
          icon={<Files className="size-3.5" />}
          label="Duplicate"
          onClick={() => fileStore.duplicateFile(file.id)}
        />
        <ActionButton
          icon={<FolderArchive className="size-3.5" />}
          label="Archive"
          onClick={() => fileStore.archiveFile(file.id)}
        />
        <ActionButton
          icon={<Trash2 className="size-3.5" />}
          label="Trash"
          onClick={() => fileStore.trashFile(file.id)}
        />
        <ActionButton
          icon={<Copy className="size-3.5" />}
          label="Public link"
          onClick={async () => {
            fileStore.makePublic(file.id);
            await navigator.clipboard.writeText(new URL(`${import.meta.env.BASE_URL}${file.id}`, window.location.origin).toString());
          }}
        />
        <ActionButton
          icon={<Eye className="size-3.5" />}
          label="Preview"
          onClick={() => {
            window.open(`${import.meta.env.BASE_URL}preview`, '_blank', 'noopener,noreferrer');
          }}
        />
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground" onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}
