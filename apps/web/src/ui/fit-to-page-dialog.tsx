import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, RotateCcw, WandSparkles } from 'lucide-react';
import { countHiddenEntries } from '@rendercv/core';
import { DialogOverlay, DialogShell } from './dialog-shell';
import { fitContentToPages } from '../features/fit/fit-content';
import {
  buildDisabledHidden,
  buildFitEntries,
  defaultFitWeights,
  FIT_WEIGHT_OPTIONS,
  listFitSections,
  mergeHidden
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
    // Sections switched "Off" are hidden up front; the search only weighs the rest.
    const disabledHidden = buildDisabledHidden(cvYaml, weights);
    const disabledCount = countHiddenEntries(disabledHidden);
    const entries = buildFitEntries(cvYaml, weights);

    const result = await fitContentToPages({
      entries,
      targetPages,
      measure: (hidden) => measure(mergeHidden(disabledHidden, hidden)),
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

    // The search trimmed nothing and no section was turned off — leave as-is.
    if (!result.applied && disabledCount === 0) {
      setRun({
        phase: 'done',
        tone: 'info',
        message: result.fit
          ? `Already fits in ${targetPages} page${targetPages > 1 ? 's' : ''}.`
          : 'Every section is set to "Keep all" — nothing can be trimmed.'
      });
      return;
    }

    onApply(mergeHidden(disabledHidden, result.hidden));

    const totalHidden = result.hiddenCount + disabledCount;
    const entryLabel = `${totalHidden} ${totalHidden === 1 ? 'entry' : 'entries'}`;
    const pageLabel = `${result.pages} page${result.pages > 1 ? 's' : ''}`;
    setRun({
      phase: 'done',
      tone: result.fit ? 'success' : 'info',
      message: result.fit
        ? `Hid ${entryLabel} to fit ${pageLabel}.`
        : `Hid ${entryLabel}, down to ${pageLabel} — still longer than ${targetPages} page${targetPages > 1 ? 's' : ''}.`
    });
  }

  const running = run.phase === 'running';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <DialogOverlay />
        <DialogShell
          closeLabel="Close fit dialog"
          description="Keeps your formatting and text — it only hides lower-priority entries until the resume fits. Nothing is deleted; you can restore hidden entries anytime."
          footer={
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
          }
          title="Fit to page"
          width="md"
        >
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
                    <div className={`min-w-0 ${weights[section.sectionKey] === 'off' ? 'opacity-50' : ''}`}>
                      <p className="truncate text-sm font-medium text-foreground">{section.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {weights[section.sectionKey] === 'off'
                          ? 'Hidden'
                          : `${section.entryCount} ${section.entryCount === 1 ? 'entry' : 'entries'}`}
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
        </DialogShell>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
