import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, RotateCcw, WandSparkles, X } from 'lucide-react';
import { countHiddenEntries } from '@rendercv/core';
import { fitContentToPages } from '../features/fit/fit-content';
import {
  buildFitEntries,
  defaultFitWeights,
  FIT_WEIGHT_OPTIONS,
  listFitSections
} from '../features/fit/fit-sections';
import type { FitWeight } from '../features/fit/fit-sections';

type RunState =
  | { phase: 'idle' }
  | { phase: 'running'; renders: number; pages?: number }
  | { phase: 'done'; message: string; tone: 'success' | 'info' | 'error' };

export function FitToPageDialog({
  open,
  onOpenChange,
  cvYaml,
  hiddenEntries,
  measure,
  onApply,
  onRestore
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvYaml: string;
  hiddenEntries: Record<string, string[]> | undefined;
  measure: (hidden: Record<string, string[]>) => Promise<number | null>;
  onApply: (hidden: Record<string, string[]>) => void;
  onRestore: () => void;
}) {
  const sections = useMemo(() => listFitSections(cvYaml), [cvYaml]);
  const [weights, setWeights] = useState<Record<string, FitWeight>>({});
  const [targetPages, setTargetPages] = useState(1);
  const [run, setRun] = useState<RunState>({ phase: 'idle' });

  const hiddenCount = countHiddenEntries(hiddenEntries);

  useEffect(() => {
    if (open) {
      setWeights(defaultFitWeights(sections));
      setRun({ phase: 'idle' });
    }
  }, [open, sections]);

  function setWeight(sectionKey: string, weight: FitWeight) {
    setWeights((current) => ({ ...current, [sectionKey]: weight }));
  }

  async function handleFit() {
    setRun({ phase: 'running', renders: 0 });
    const entries = buildFitEntries(cvYaml, weights);

    const result = await fitContentToPages({
      entries,
      targetPages,
      measure,
      onProgress: (renders, pages) => setRun({ phase: 'running', renders, pages })
    });

    if (!result) {
      setRun({
        phase: 'done',
        tone: 'error',
        message: 'Could not render the resume — fix any preview errors and try again.'
      });
      return;
    }

    if (!result.applied) {
      if (result.fit) {
        setRun({
          phase: 'done',
          tone: 'info',
          message: `Already fits in ${targetPages} page${targetPages > 1 ? 's' : ''}.`
        });
      } else {
        setRun({
          phase: 'done',
          tone: 'info',
          message: 'Every section is set to "Keep all" — nothing can be trimmed.'
        });
      }
      return;
    }

    onApply(result.hidden);
    setRun({
      phase: 'done',
      tone: result.fit ? 'success' : 'info',
      message: result.fit
        ? `Hid ${result.hiddenCount} ${result.hiddenCount === 1 ? 'entry' : 'entries'} to fit ${result.pages} page${result.pages > 1 ? 's' : ''}.`
        : `Trimmed ${result.hiddenCount} entries down to ${result.pages} pages — content is too long for ${targetPages}.`
    });
  }

  const running = run.phase === 'running';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(40rem,calc(100vh-2rem))] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl border border-border bg-background shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="text-lg font-semibold text-foreground">Fit to page</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Keeps your formatting and text — it only hides lower-priority entries until the
                resume fits. Nothing is deleted; you can restore hidden entries anytime.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close fit dialog"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                type="button"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">Target length</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={targetPages}
                  onChange={(event) =>
                    setTargetPages(Math.max(1, Math.min(10, Number(event.target.value) || 1)))
                  }
                  className="h-9 w-16 rounded-lg border border-border bg-background px-2 text-center text-sm text-foreground outline-none focus:border-primary"
                />
                <span>page{targetPages > 1 ? 's' : ''}</span>
              </div>
            </div>

            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Section priority
            </p>
            {sections.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                This CV has no sections to prioritize.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {sections.map((section) => (
                  <li
                    key={section.sectionKey}
                    className="flex flex-col gap-2 rounded-xl border border-border/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{section.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {section.entryCount} {section.entryCount === 1 ? 'entry' : 'entries'}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-0.5 rounded-lg bg-muted/60 p-0.5">
                      {FIT_WEIGHT_OPTIONS.map((option) => {
                        const active = (weights[section.sectionKey] ?? 'normal') === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={running}
                            onClick={() => setWeight(section.sectionKey, option.value)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                              active
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {run.phase === 'done' ? (
              <p
                className={`mt-4 rounded-xl px-3 py-2.5 text-sm ${
                  run.tone === 'success'
                    ? 'bg-primary/10 text-primary'
                    : run.tone === 'error'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {run.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {hiddenCount > 0 ? (
                <button
                  type="button"
                  disabled={running}
                  onClick={onRestore}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  <RotateCcw className="size-3.5" />
                  Restore {hiddenCount} hidden
                </button>
              ) : null}
            </div>
            <button
              type="button"
              disabled={running || sections.length === 0}
              onClick={() => void handleFit()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {run.pages ? `Trying ${run.pages} pages…` : 'Measuring…'}
                </>
              ) : (
                <>
                  <WandSparkles className="size-4" />
                  Fit now
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
