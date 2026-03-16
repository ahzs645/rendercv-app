import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { fileStore } from '@rendercv/core';

const MAX_YAML_SIZE = 1024 * 1024;

export function YamlImportButton({ mode = 'full' }: { mode?: 'full' | 'compact' | 'mini' }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const mini = mode === 'mini';

  async function importFile(file: File) {
    const isYamlFile = /\.ya?ml$/i.test(file.name);
    if (!isYamlFile) {
      toast.error('Choose a YAML file.');
      return;
    }

    if (file.size > MAX_YAML_SIZE) {
      toast.error('YAML must be 1 MB or smaller.');
      return;
    }

    setPending(true);
    try {
      const content = await file.text();
      if (!content.trim()) {
        toast.error('YAML file is empty.');
        return;
      }

      if (!/^\s*cv\s*:/m.test(content)) {
        toast.error('Expected a RenderCV YAML file with a top-level cv: key.');
        return;
      }

      const name = file.name.replace(/\.ya?ml$/i, '') || 'Imported CV';
      fileStore.createFile(name, { cv: content });
      toast.success('YAML imported into a new CV.');

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import YAML.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        accept=".yaml,.yml,text/yaml,application/x-yaml,text/plain"
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
        className={`inline-flex w-full items-center rounded-md text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
          mini ? 'h-10 justify-center px-0' : 'h-10 justify-start gap-2 px-3'
        }`}
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        title="Import YAML"
        type="button"
      >
        <Upload className="size-4 shrink-0" />
        {mini ? (
          <span className="sr-only">{pending ? 'Importing YAML' : 'Import YAML'}</span>
        ) : (
          <span>{pending ? 'Importing YAML…' : 'Import YAML'}</span>
        )}
      </button>
    </>
  );
}
