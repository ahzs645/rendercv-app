import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createDefaultEntry,
  detectEntryType,
  entryTypeOptions,
  findTemplateByName
} from './schema/entry-templates';
import {
  customConnectionTemplate,
  socialNetworkTemplate
} from './schema/cv-schema';
import { EntryArrayEditor } from './entry-array-editor';
import { MobileReorderControls } from './primitives';
import { SECTION_PRESETS, type SectionPreset } from './section-presets';
import {
  asArray,
  asRecord,
  dictionaryKeyToTitle,
  properSectionTitleToKey,
  createUniqueSectionKey,
  renameRecordKey,
  removeRecordKey,
  moveRecordEntry,
  insertRecordEntryAt
} from './utils';

type DragHandleProps = {
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  listeners: ReturnType<typeof useSortable>['listeners'];
};

export function CvSectionEditor({
  entriesExpanded,
  rootValue,
  onChange,
  disabledSections,
  onToggleSectionDisabled,
  activeVariantKey,
  variantLabel,
  variantExcludedSections,
  hideArchivedEntries
}: {
  entriesExpanded: boolean;
  rootValue: Record<string, unknown>;
  onChange: (nextRoot: Record<string, unknown>) => void;
  disabledSections?: string[];
  onToggleSectionDisabled?: (sectionKey: string) => void;
  activeVariantKey?: string | null;
  variantLabel?: string;
  variantExcludedSections?: string[];
  hideArchivedEntries?: boolean;
}) {
  const socialNetworks = asArray(rootValue.social_networks);
  const customConnections = asArray(rootValue.custom_connections);
  const sections = asRecord(rootValue.sections);

  function updateCvField(key: string, value: unknown) {
    onChange({ ...rootValue, [key]: value });
  }

  function updateSections(nextSections: Record<string, unknown>) {
    onChange({ ...rootValue, sections: nextSections });
  }

  return (
    <>
      <EntryArrayEditor
        title="Social Networks"
        entries={socialNetworks}
        entriesExpanded={entriesExpanded}
        template={socialNetworkTemplate}
        onChange={(nextEntries) => updateCvField('social_networks', nextEntries)}
        originPath={['social_networks']}
      />
      <EntryArrayEditor
        title="Custom Connections"
        entries={customConnections}
        entriesExpanded={entriesExpanded}
        template={customConnectionTemplate}
        onChange={(nextEntries) => updateCvField('custom_connections', nextEntries)}
        originPath={['custom_connections']}
      />
      <SectionMapEditor
        entriesExpanded={entriesExpanded}
        sections={sections}
        onChange={updateSections}
        disabledSections={disabledSections}
        onToggleSectionDisabled={onToggleSectionDisabled}
        activeVariantKey={activeVariantKey}
        variantLabel={variantLabel}
        variantExcludedSections={variantExcludedSections}
        hideArchivedEntries={hideArchivedEntries}
      />
    </>
  );
}

function SectionMapEditor({
  entriesExpanded,
  sections,
  onChange,
  disabledSections,
  onToggleSectionDisabled,
  activeVariantKey,
  variantLabel,
  variantExcludedSections,
  hideArchivedEntries
}: {
  entriesExpanded: boolean;
  sections: Record<string, unknown>;
  onChange: (sections: Record<string, unknown>) => void;
  disabledSections?: string[];
  onToggleSectionDisabled?: (sectionKey: string) => void;
  activeVariantKey?: string | null;
  variantLabel?: string;
  variantExcludedSections?: string[];
  hideArchivedEntries?: boolean;
}) {
  const disabledSet = new Set(disabledSections ?? []);
  const variantExcludedSet = new Set(variantExcludedSections ?? []);
  const sectionEntries = Object.entries(sections);
  const sectionKeys = sectionEntries.map(([sectionKey]) => sectionKey);

  // Keep the freshest sections + onChange so a deferred Undo (from the toast)
  // re-inserts into the current document rather than a stale snapshot.
  const latestRef = useRef({ sections, onChange });
  latestRef.current = { sections, onChange };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  function addBlankSection() {
    const key = createUniqueSectionKey(sections, 'new_section');
    onChange({
      ...sections,
      [key]: []
    });
  }

  function addPresetSection(preset: SectionPreset) {
    const baseKey = properSectionTitleToKey(preset.title) || preset.id;
    const key = createUniqueSectionKey(sections, baseKey);
    const initialEntries: unknown[] =
      preset.entryKind === 'text' ? [''] : [createDefaultEntry(findTemplateByName(preset.entryKind)!)];

    onChange({
      ...sections,
      [key]: initialEntries
    });
  }

  function renameSection(oldKey: string, nextTitle: string) {
    const nextKey = properSectionTitleToKey(nextTitle);
    if (!nextKey || nextKey === oldKey || Object.hasOwn(sections, nextKey)) {
      return;
    }
    onChange(renameRecordKey(sections, oldKey, nextKey));
  }

  function deleteSection(sectionKey: string) {
    const index = sectionKeys.indexOf(sectionKey);
    const removedValue = sections[sectionKey];
    const title = dictionaryKeyToTitle(sectionKey);
    onChange(removeRecordKey(sections, sectionKey));
    toast(`Removed "${title}" section`, {
      action: {
        label: 'Undo',
        onClick: () => {
          const { sections: latestSections, onChange: latestOnChange } = latestRef.current;
          latestOnChange(insertRecordEntryAt(latestSections, sectionKey, removedValue, index));
        }
      }
    });
  }

  function updateSectionEntries(sectionKey: string, nextEntries: unknown[]) {
    onChange({
      ...sections,
      [sectionKey]: nextEntries
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sectionKeys.indexOf(String(active.id));
    const newIndex = sectionKeys.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    onChange(moveRecordEntry(sections, oldIndex, newIndex));
  }

  function moveSection(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sectionKeys.length) return;

    onChange(moveRecordEntry(sections, index, nextIndex));
  }

  return (
    <section>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionKeys} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {sectionEntries.map(([sectionKey, sectionValue], sectionIndex) => (
              <SortableSectionEditor
                key={sectionKey}
                sectionKey={sectionKey}
                entries={asArray(sectionValue)}
                entriesExpanded={entriesExpanded}
                canMoveUp={sectionIndex > 0}
                canMoveDown={sectionIndex < sectionEntries.length - 1}
                onMove={(direction) => moveSection(sectionIndex, direction)}
                disabled={disabledSet.has(sectionKey)}
                variantExcluded={variantExcludedSet.has(sectionKey)}
                activeVariantKey={activeVariantKey ?? null}
                variantLabel={variantLabel ?? ''}
                hideArchivedEntries={hideArchivedEntries ?? false}
                onToggleDisabled={
                  onToggleSectionDisabled ? () => onToggleSectionDisabled(sectionKey) : undefined
                }
                onDelete={() => deleteSection(sectionKey)}
                onRename={renameSection}
                onChangeEntries={(nextEntries) => updateSectionEntries(sectionKey, nextEntries)}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>
      <AddSectionMenu
        existingKeys={sectionKeys}
        onAddCustom={addBlankSection}
        onAddPreset={addPresetSection}
      />
      <div className="h-[20vh]" />
    </section>
  );
}

function SortableSectionEditor(props: {
  sectionKey: string;
  entries: unknown[];
  entriesExpanded: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  disabled: boolean;
  variantExcluded: boolean;
  activeVariantKey: string | null;
  variantLabel: string;
  hideArchivedEntries: boolean;
  onToggleDisabled?: () => void;
  onRename: (oldKey: string, nextTitle: string) => void;
  onDelete: () => void;
  onChangeEntries: (entries: unknown[]) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.sectionKey });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative'
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
    >
      <SectionEditor {...props} dragHandle={{ setActivatorNodeRef, listeners }} />
    </motion.div>
  );
}

function SectionEditor({
  sectionKey,
  entries,
  entriesExpanded,
  canMoveUp,
  canMoveDown,
  onMove,
  disabled,
  variantExcluded,
  activeVariantKey,
  variantLabel,
  hideArchivedEntries,
  onToggleDisabled,
  onRename,
  onDelete,
  onChangeEntries,
  dragHandle
}: {
  sectionKey: string;
  entries: unknown[];
  entriesExpanded: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  disabled: boolean;
  variantExcluded: boolean;
  activeVariantKey: string | null;
  variantLabel: string;
  hideArchivedEntries?: boolean;
  onToggleDisabled?: () => void;
  onRename: (oldKey: string, nextTitle: string) => void;
  onDelete: () => void;
  onChangeEntries: (entries: unknown[]) => void;
  dragHandle: DragHandleProps;
}) {
  const [title, setTitle] = useState(dictionaryKeyToTitle(sectionKey));
  const detectedTemplate = detectEntryType(entries[0]);
  const isEmpty = entries.length === 0;
  // A section is hidden from the PDF if manually disabled or excluded by the
  // active variant. The two are styled differently: amber for manual, the
  // primary/brand color for variant-driven so authors can tell them apart.
  const hiddenFromResume = disabled || variantExcluded;
  const variantActive = Boolean(activeVariantKey);

  useEffect(() => {
    setTitle(dictionaryKeyToTitle(sectionKey));
  }, [sectionKey]);

  function chooseEntryType(nextTemplateName: string) {
    if (nextTemplateName === 'text') {
      onChangeEntries(['']);
      return;
    }

    const nextTemplate = findTemplateByName(nextTemplateName);
    if (nextTemplate) {
      onChangeEntries([createDefaultEntry(nextTemplate)]);
    }
  }

  return (
    <article className="form-section form-item-enter-anim" data-section-key={sectionKey}>
      {/* Gutter only from `sm` up — see the note in entry-array-editor.tsx. */}
      <div className="group/section relative mt-3 mb-2 flex min-h-12 items-center sm:-mx-7 sm:px-7 sm:min-h-11">
        <div
          ref={dragHandle.setActivatorNodeRef}
          {...dragHandle.listeners}
          aria-label="Drag to reorder section"
          className="form-item-control absolute top-1/2 left-1 hidden size-6 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-none text-muted-foreground/40 active:cursor-grabbing sm:flex"
        >
          <GripVertical className="size-3.5" />
        </div>
        <MobileReorderControls
          align="center"
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMove={onMove}
          label="section"
        />
        <input
          className={`ml-6 flex-1 border-b border-muted-foreground/40 bg-transparent py-2 pr-[76px] text-base font-semibold outline-none sm:ml-0 sm:py-0 sm:pr-2 sm:text-[15px] ${
            hiddenFromResume ? 'text-foreground/40 line-through decoration-1' : 'text-foreground/80'
          }`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => onRename(sectionKey, title)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onRename(sectionKey, title);
            }
          }}
        />
        {variantExcluded ? (
          <span
            className="ml-2 hidden shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary sm:inline"
            title={`Excluded from the "${variantLabel}" variant`}
          >
            Off in {variantLabel}
          </span>
        ) : null}
        <div className="absolute top-1/2 right-0 flex -translate-y-1/2 items-center sm:right-1">
          {onToggleDisabled ? (
            <button
              type="button"
              className={`flex size-9 items-center justify-center rounded-md transition-opacity hover:bg-muted sm:size-6 sm:rounded-none sm:hover:bg-transparent ${
                variantExcluded
                  ? 'text-primary opacity-100'
                  : disabled
                    ? 'text-amber-600 opacity-100 sm:text-amber-600'
                    : 'text-muted-foreground/70 opacity-90 hover:text-foreground md:opacity-60 md:group-hover/section:opacity-100'
              }`}
              aria-label={
                variantActive
                  ? variantExcluded
                    ? 'Include section in variant'
                    : 'Exclude section from variant'
                  : hiddenFromResume
                    ? 'Enable section in resume'
                    : 'Disable section in resume'
              }
              title={
                variantActive
                  ? variantExcluded
                    ? `Excluded from the "${variantLabel}" variant. Click to include.`
                    : `Exclude this section from the "${variantLabel}" variant`
                  : hiddenFromResume
                    ? 'Disabled — excluded from the resume. Click to enable.'
                    : 'Disable section — keep it here but exclude it from the resume'
              }
              onClick={onToggleDisabled}
            >
              {hiddenFromResume ? <EyeOff className="size-4 sm:size-3.5" /> : <Eye className="size-4 sm:size-3.5" />}
            </button>
          ) : null}
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground/70 opacity-90 transition-opacity hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 sm:size-6 sm:rounded-none sm:hover:bg-transparent md:opacity-60 md:group-hover/section:opacity-100"
            aria-label="Delete section"
            onClick={onDelete}
          >
            <X className="size-4 sm:size-3" />
          </button>
        </div>
      </div>
      <div className={hiddenFromResume ? 'opacity-45' : undefined}>
        {isEmpty ? (
          <EntryTypeChooser onChoose={chooseEntryType} />
        ) : (
          <EntryArrayEditor
            title={dictionaryKeyToTitle(sectionKey)}
            entries={entries}
            entriesExpanded={entriesExpanded}
            template={detectedTemplate}
            onChange={onChangeEntries}
            showHeader={false}
            sectionKey={sectionKey}
            originPath={['sections', sectionKey]}
            hideArchivedEntries={hideArchivedEntries}
          />
        )}
      </div>
    </article>
  );
}

function AddSectionMenu({
  existingKeys,
  onAddCustom,
  onAddPreset
}: {
  existingKeys: string[];
  onAddCustom: () => void;
  onAddPreset: (preset: SectionPreset) => void;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<{ dropUp: boolean; maxHeight: number }>({
    dropUp: false,
    maxHeight: 0
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const existingKeySet = new Set(existingKeys);
  const availablePresets = SECTION_PRESETS.filter(
    (preset) => !existingKeySet.has(properSectionTitleToKey(preset.title))
  );

  // Decide whether the menu should drop down or flip up, and how tall it can be,
  // so every option stays reachable even when the trigger sits near the bottom
  // of the scrollable form (common on mobile).
  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const margin = 12;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const dropUp = spaceBelow < 280 && spaceAbove > spaceBelow;
      setPlacement({
        dropUp,
        maxHeight: Math.max(180, Math.round(dropUp ? spaceAbove : spaceBelow))
      });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative mt-4">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border/60 px-3 py-3 text-sm text-muted-foreground/80 transition-colors hover:border-border hover:text-foreground sm:min-h-0 sm:gap-1.5 sm:py-2.5 sm:text-xs sm:text-muted-foreground/70"
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        <Plus className="size-4 sm:size-3.5" />
        Add Section
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute left-0 right-0 z-30 overflow-auto rounded-md border border-border bg-popover p-2 shadow-lg ${
            placement.dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
          style={{ maxHeight: placement.maxHeight ? `${placement.maxHeight}px` : '60vh' }}
        >
          {availablePresets.length > 0 ? (
            <>
              <p className="px-2 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Presets
              </p>
              <ul className="space-y-0.5">
                {availablePresets.map((preset) => (
                  <li key={preset.id}>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full flex-col items-start gap-0.5 rounded-sm px-2 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        onAddPreset(preset);
                        setOpen(false);
                      }}
                    >
                      <span className="text-sm font-medium text-foreground">{preset.title}</span>
                      <span className="text-[11px] leading-4 text-muted-foreground">
                        {preset.description}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="my-2 h-px bg-border/60" />
            </>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex w-full flex-col items-start gap-0.5 rounded-sm px-2 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              onAddCustom();
              setOpen(false);
            }}
          >
            <span className="text-sm font-medium text-foreground">Custom section…</span>
            <span className="text-[11px] leading-4 text-muted-foreground">
              Empty section. Choose an entry type after adding.
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function EntryTypeChooser({ onChoose }: { onChoose: (entryType: string) => void }) {
  return (
    <div className="flex flex-col gap-2 pt-1 pb-3 pl-4">
      <p className="text-[11px] tracking-wider text-muted-foreground/50 uppercase">Entry type</p>
      <div className="flex flex-wrap gap-1">
        {entryTypeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className="min-h-10 rounded-md border border-border/60 px-3 py-2 text-sm text-muted-foreground/80 transition-colors hover:bg-accent hover:text-foreground sm:min-h-0 sm:rounded sm:px-2 sm:py-1 sm:text-xs sm:text-muted-foreground/70"
            onClick={() => onChoose(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
