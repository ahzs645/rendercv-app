import { useEffect, useState } from 'react';
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
import { GripVertical, Plus, X } from 'lucide-react';
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
import {
  asArray,
  asRecord,
  dictionaryKeyToTitle,
  properSectionTitleToKey,
  createUniqueSectionKey,
  renameRecordKey,
  removeRecordKey,
  moveRecordEntry
} from './utils';

type DragHandleProps = {
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  listeners: ReturnType<typeof useSortable>['listeners'];
};

export function CvSectionEditor({
  entriesExpanded,
  rootValue,
  onChange
}: {
  entriesExpanded: boolean;
  rootValue: Record<string, unknown>;
  onChange: (nextRoot: Record<string, unknown>) => void;
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
      <SectionMapEditor entriesExpanded={entriesExpanded} sections={sections} onChange={updateSections} />
    </>
  );
}

function SectionMapEditor({
  entriesExpanded,
  sections,
  onChange
}: {
  entriesExpanded: boolean;
  sections: Record<string, unknown>;
  onChange: (sections: Record<string, unknown>) => void;
}) {
  const sectionEntries = Object.entries(sections);
  const sectionKeys = sectionEntries.map(([sectionKey]) => sectionKey);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  function addSection() {
    const key = createUniqueSectionKey(sections, 'new_section');
    onChange({
      ...sections,
      [key]: []
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
    onChange(removeRecordKey(sections, sectionKey));
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

  return (
    <section>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionKeys} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {sectionEntries.map(([sectionKey, sectionValue]) => (
              <SortableSectionEditor
                key={sectionKey}
                sectionKey={sectionKey}
                entries={asArray(sectionValue)}
                entriesExpanded={entriesExpanded}
                onDelete={() => deleteSection(sectionKey)}
                onRename={renameSection}
                onChangeEntries={(nextEntries) => updateSectionEntries(sectionKey, nextEntries)}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border/60 px-3 py-3 text-sm text-muted-foreground/80 transition-colors hover:border-border hover:text-foreground sm:min-h-0 sm:gap-1.5 sm:py-2.5 sm:text-xs sm:text-muted-foreground/70"
        onClick={addSection}
      >
        <Plus className="size-4 sm:size-3.5" />
        Add New Section
      </button>
      <div className="h-[20vh]" />
    </section>
  );
}

function SortableSectionEditor(props: {
  sectionKey: string;
  entries: unknown[];
  entriesExpanded: boolean;
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
  onRename,
  onDelete,
  onChangeEntries,
  dragHandle
}: {
  sectionKey: string;
  entries: unknown[];
  entriesExpanded: boolean;
  onRename: (oldKey: string, nextTitle: string) => void;
  onDelete: () => void;
  onChangeEntries: (entries: unknown[]) => void;
  dragHandle: DragHandleProps;
}) {
  const [title, setTitle] = useState(dictionaryKeyToTitle(sectionKey));
  const detectedTemplate = detectEntryType(entries[0]);
  const isEmpty = entries.length === 0;

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
      <div className="group/section relative -mx-7 mt-3 mb-2 flex min-h-11 items-center px-7">
        <div
          ref={dragHandle.setActivatorNodeRef}
          {...dragHandle.listeners}
          aria-label="Drag to reorder section"
          className="form-item-control absolute top-1/2 left-0 flex size-9 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground/60 active:cursor-grabbing sm:left-1 sm:size-6 sm:rounded-none sm:text-muted-foreground/40"
        >
          <GripVertical className="size-4 sm:size-3.5" />
        </div>
        <input
          className="flex-1 border-b border-muted-foreground/40 bg-transparent py-2 text-base font-semibold text-foreground/80 outline-none sm:py-0 sm:text-[15px]"
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
        <button
          type="button"
          className="absolute top-1/2 right-0 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/70 opacity-90 transition-opacity hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 sm:right-1 sm:size-6 sm:rounded-none sm:hover:bg-transparent md:opacity-60 md:group-hover/section:opacity-100"
          aria-label="Delete section"
          onClick={onDelete}
        >
          <X className="size-4 sm:size-3" />
        </button>
      </div>
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
        />
      )}
    </article>
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
