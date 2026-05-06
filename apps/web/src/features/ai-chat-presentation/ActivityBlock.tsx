import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, LoaderCircle, X } from 'lucide-react';
import type { Entry } from './segmentize';
import { getToolIcon, getToolLabel } from './tool-registry';

function StatusIcon({ status }: { status: 'running' | 'done' | 'error' }) {
  if (status === 'done') return <Check className="size-3.5 text-emerald-600" />;
  if (status === 'error') return <X className="size-3.5 text-destructive" />;
  return <LoaderCircle className="size-3.5 animate-spin text-muted-foreground" />;
}

function EntryRow({ entry }: { entry: Entry }) {
  if (entry.kind === 'reasoning') {
    return (
      <div className="rounded-lg bg-background/70 px-2.5 py-2">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="size-1.5 rounded-full bg-primary" />
          <span>{entry.title || 'Reasoning'}</span>
        </div>
        {entry.content ? (
          <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{entry.content}</p>
        ) : null}
      </div>
    );
  }

  const Icon = getToolIcon(entry.toolName);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-background/70 px-2.5 py-2 text-xs">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="font-medium">{getToolLabel(entry.toolName)}</span>
      {entry.detail ? <span className="min-w-0 truncate text-muted-foreground">{entry.detail}</span> : null}
      <span className="ml-auto">
        <StatusIcon status={entry.status} />
      </span>
    </div>
  );
}

export function ActivityBlock({ entries }: { entries: Entry[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleEntries = expanded ? entries : entries.slice(-3);
  const hiddenCount = entries.length - visibleEntries.length;

  return (
    <div className="my-2 rounded-xl border border-border/70 bg-muted/45 p-2">
      <button
        className="mb-1 flex w-full items-center gap-2 px-1 py-1 text-left text-xs font-medium text-muted-foreground"
        onClick={() => setExpanded((value) => !value)}
        type="button"
      >
        {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        <span>Assistant activity</span>
        {hiddenCount > 0 ? <span className="ml-auto">{hiddenCount} hidden</span> : null}
      </button>
      <div className="space-y-1.5">
        {visibleEntries.map((entry, index) => (
          <EntryRow key={`${entry.kind}-${index}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}

