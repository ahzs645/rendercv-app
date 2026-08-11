import { Fragment, useEffect, useRef, useState } from 'react';
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
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  X
} from 'lucide-react';
import { useEntryHidden } from './hidden-entries-context';
import { useEntryVariantState } from './variant-visibility-context';
import {
  createDefaultEntry,
  positionSubTemplate
} from './schema/entry-templates';
import type { EntryTemplate, FieldDef } from './schema/types';
import { FieldControl } from './field-controls';
import { DiffScopeProvider } from './diff-context';
import { MobileReorderControls, TextRow, Divider } from './primitives';
import {
  asRecord,
  asArray,
  getNestedValue,
  updateEntryField,
  stringValue,
  labelWidthForFields,
  labelWidthForTemplate,
  dynamicEntryMarker,
  entryAddLabel,
  activeDateScheme,
  filterDateFields,
  hasDateFields
} from './utils';

export function EntryArrayEditor({
  title,
  entries,
  entriesExpanded = true,
  template,
  onChange,
  showHeader = true,
  addLabel,
  sectionKey,
  originPath,
  hideArchivedEntries = false
}: {
  title: string;
  entries: unknown[];
  entriesExpanded?: boolean;
  template: EntryTemplate | 'text';
  onChange: (entries: unknown[]) => void;
  showHeader?: boolean;
  addLabel?: string;
  sectionKey?: string;
  originPath?: (string | number)[];
  hideArchivedEntries?: boolean;
}) {
  const labelWidth = labelWidthForTemplate(template);
  const nextIdRef = useRef(0);
  const [itemIds, setItemIds] = useState<number[]>(() =>
    entries.map(() => nextIdRef.current++)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  // Synchronously sync IDs when entries length changes (avoids a render with undefined keys)
  if (itemIds.length !== entries.length) {
    setItemIds(entries.map(() => nextIdRef.current++));
  }

  function addEntry() {
    setItemIds(prev => [...prev, nextIdRef.current++]);
    onChange([
      ...entries,
      template === 'text' ? '' : createDefaultEntry(template)
    ]);
  }

  function updateEntry(index: number, value: unknown) {
    const nextEntries = [...entries];
    nextEntries[index] = value;
    onChange(nextEntries);
  }

  function removeEntry(index: number) {
    setItemIds(prev => prev.filter((_, i) => i !== index));
    onChange(entries.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = itemIds.indexOf(Number(active.id));
    const newIndex = itemIds.indexOf(Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    setItemIds(prev => arrayMove(prev, oldIndex, newIndex));
    onChange(arrayMove([...entries], oldIndex, newIndex));
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= entries.length) return;

    setItemIds(prev => arrayMove(prev, index, nextIndex));
    onChange(arrayMove([...entries], index, nextIndex));
  }

  const entryList = entries.map((entry, index) => (
    <SortableEntryArrayItem
      key={itemIds[index]}
      id={itemIds[index]!}
      entry={entry}
      index={index}
      entriesLength={entries.length}
      entriesExpanded={entriesExpanded}
      onChange={updateEntry}
      onRemove={removeEntry}
      onMove={moveEntry}
      template={template}
      sectionKey={sectionKey}
      originPath={originPath}
      hideArchivedEntries={hideArchivedEntries}
    />
  ));

  return (
    <section style={{ '--label-width': labelWidth } as CSSProperties}>
      {showHeader ? (
        <>
          <div className="py-1.5">
            <div className="flex items-center">
              <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, auto)' }}>
                {title}
              </span>
              <div className="flex flex-1 items-center justify-end gap-3">
                <button
                  className="form-touch-inline inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground/70 hover:bg-muted hover:text-foreground sm:min-h-0 sm:px-0 sm:text-[11px]"
                  onClick={addEntry}
                  type="button"
                >
                  <Plus className="size-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
          <div className="pl-0 sm:pl-4">
            {entries.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                  <div><AnimatePresence initial={false}>{entryList}</AnimatePresence></div>
                </SortableContext>
              </DndContext>
            ) : null}
          </div>
          <Divider />
        </>
      ) : null}
      {!showHeader ? (
        <div className="pl-0 sm:pl-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              <AnimatePresence initial={false}>{entryList}</AnimatePresence>
            </SortableContext>
          </DndContext>
          <button
            type="button"
            className="form-touch-inline mt-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground sm:mt-1.5 sm:min-h-0 sm:px-0 sm:text-xs"
            onClick={addEntry}
          >
            <Plus className="size-3.5" />
            {addLabel ?? `Add ${entryAddLabel(template)}`}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function SortableEntryArrayItem({
  id,
  entry,
  index,
  entriesLength,
  entriesExpanded,
  template,
  onChange,
  onRemove,
  onMove,
  sectionKey,
  originPath,
  hideArchivedEntries = false
}: {
  id: number;
  entry: unknown;
  index: number;
  entriesLength: number;
  entriesExpanded: boolean;
  template: EntryTemplate | 'text';
  onChange: (index: number, value: unknown) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  sectionKey?: string;
  originPath?: (string | number)[];
  hideArchivedEntries?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const hiddenState = useEntryHidden(sectionKey, entry);
  const variantState = useEntryVariantState(sectionKey, entry);
  const hiddenByVariant = variantState?.hiddenByVariant ?? false;
  const isArchived = variantState?.archived ?? false;
  // Manual hide OR variant exclusion both grey the entry out in the editor. The
  // eye toggle routes to whichever is active (variant vs file-global manual) via
  // the hidden-entries context, set up in the workspace.
  const isHidden = (hiddenState?.hidden ?? false) || hiddenByVariant;

  // When the user opts to hide archived entries, drop them from the form list
  // entirely (they remain in the document and are always excluded from the PDF).
  if (hideArchivedEntries && isArchived) {
    return null;
  }

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
      data-section-key={sectionKey}
      data-entry-index={index}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* The `-mx-7` gutter only exists from `sm` up: on mobile the form pane has
          less side padding than the gutter, so pulling rows outwards made the
          whole editor scroll sideways. Mobile keeps its controls inside the row. */}
      {/* Entries used to butt straight up against each other with the same
          hairline between them as between two fields inside one entry, so the
          seam between "this job" and "the next job" was invisible. A rule and
          real spacing from the second entry on gives each one an edge. */}
      <div
        className={`form-item-wrapper form-item-enter-anim relative sm:-mx-7 sm:px-7 ${
          index > 0 ? 'mt-3 border-t border-border pt-3' : ''
        }`}
      >
        {/* Anchored to the top of the entry, not its middle: centring put the
            handle and the hide/delete cluster beside whichever field happened
            to fall halfway down, where they read as that row's controls. */}
        <div
          ref={setActivatorNodeRef}
          {...listeners}
          className={`form-item-control absolute left-1 hidden size-6 items-center justify-center rounded-none cursor-grab touch-none text-muted-foreground/40 active:cursor-grabbing sm:flex ${
            index > 0 ? 'top-4' : 'top-1'
          }`}
        >
          <GripVertical className="size-3.5" />
        </div>
        <MobileReorderControls
          canMoveUp={index > 0}
          canMoveDown={index < entriesLength - 1}
          onMove={(direction) => onMove(index, direction)}
          label="entry"
        />
        <div
          className={`absolute right-0 flex items-center gap-0.5 sm:right-1 sm:gap-1 ${
            index > 0 ? 'top-3 sm:top-4' : 'top-0 sm:top-1'
          }`}
        >
          {isArchived ? (
            <span
              className="hidden shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline"
              title="Tagged archived — always excluded from the PDF"
            >
              Archived
            </span>
          ) : hiddenByVariant ? (
            <span
              className="hidden shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary sm:inline"
              title={`Hidden from the "${variantState?.variantLabel}" variant`}
            >
              Off in {variantState?.variantLabel}
            </span>
          ) : null}
          {hiddenState ? (
            <button
              type="button"
              className={`form-item-control form-touch-target flex size-9 items-center justify-center rounded-md hover:bg-muted sm:size-6 sm:rounded-none sm:hover:bg-transparent ${
                hiddenByVariant
                  ? 'text-primary'
                  : isHidden
                    ? 'text-amber-600 sm:text-amber-600'
                    : 'text-muted-foreground/60 hover:text-foreground sm:text-muted-foreground/40'
              }`}
              onClick={hiddenState.toggle}
              aria-label={isHidden ? 'Show in resume' : 'Hide from resume'}
              title={
                variantState?.variantLabel
                  ? isHidden
                    ? `Hidden from the "${variantState.variantLabel}" variant — click to show`
                    : `Hide from the "${variantState.variantLabel}" variant`
                  : isHidden
                    ? 'Hidden from the resume — click to show'
                    : 'Hide from the resume'
              }
            >
              {isHidden ? <EyeOff className="size-4 sm:size-3.5" /> : <Eye className="size-4 sm:size-3.5" />}
            </button>
          ) : null}
          <button
            type="button"
            className="form-item-control form-touch-target flex size-9 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-muted hover:text-destructive sm:size-6 sm:rounded-none sm:hover:bg-transparent"
            onClick={() => onRemove(index)}
            aria-label="Remove"
          >
            <X className="size-4 sm:size-3" />
          </button>
        </div>
        {/* On phones the right-hand reserve used to run the full height of the
            entry, even though the controls only occupy its top-right corner and
            the collapsed-header row already carries its own `pr-16`. Reserving
            it everywhere stacked with each nested row's own gutter and left a
            highlight roughly a third of the screen wide. The status badges it
            also cleared are `sm:inline` only, so none of it applied on mobile. */}
        <div className={`pl-10 sm:pr-12 sm:pl-0 ${isHidden ? 'opacity-45' : ''}`}>
          {template === 'text' ? (
            <TextRow
              value={typeof entry === 'string' ? entry : ''}
              onChange={(nextValue) => onChange(index, nextValue)}
              placeholder="Enter text..."
            />
          ) : originPath ? (
            <DiffScopeProvider path={[...originPath, index]}>
              <TemplateEntryFields
                entry={asRecord(entry)}
                index={index}
                entriesExpanded={entriesExpanded}
                total={entriesLength}
                template={template}
                onChange={(nextValue) => onChange(index, nextValue)}
              />
            </DiffScopeProvider>
          ) : (
            <TemplateEntryFields
              entry={asRecord(entry)}
              index={index}
              entriesExpanded={entriesExpanded}
              total={entriesLength}
              template={template}
              onChange={(nextValue) => onChange(index, nextValue)}
            />
          )}
          {index < entriesLength - 1 ? <Divider /> : null}
        </div>
      </div>
    </motion.div>
  );
}

function TemplateEntryFields({
  entry,
  index,
  entriesExpanded,
  total,
  template,
  onChange
}: {
  entry: Record<string, unknown>;
  index: number;
  entriesExpanded: boolean;
  total: number;
  template: EntryTemplate;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const [expanded, setExpanded] = useState(entriesExpanded);
  const dynamicLabel = dynamicEntryMarker(template.name, index, total);

  useEffect(() => {
    setExpanded(entriesExpanded);
  }, [entriesExpanded, template.name]);

  function updateField(path: string[], nextValue: unknown) {
    onChange(updateEntryField(entry, path, nextValue));
  }

  if (template.compact) {
    if (dynamicLabel && template.fields.length === 1) {
      const field = template.fields[0]!;
      return (
        <TextRow
          label={dynamicLabel}
          value={stringValue(getNestedValue(entry, field.path))}
          onChange={(nextValue) => updateField(field.path, nextValue)}
          placeholder={field.placeholder}
        />
      );
    }

    const compactFields = filterDateFields(template.fields, entry);
    return (
      <div style={{ '--label-width': labelWidthForTemplate(template) } as CSSProperties}>
        {compactFields.map((field, fieldIndex) => (
          <Fragment key={`${index}-${field.path.join('.')}`}>
            <FieldControl
              field={field}
              value={getNestedValue(entry, field.path)}
              onChange={(nextValue) => updateField(field.path, nextValue)}
            />
            {fieldIndex < compactFields.length - 1 ? <Divider /> : null}
          </Fragment>
        ))}
      </div>
    );
  }

  const hasPositions =
    template.name === 'experience' &&
    Array.isArray(entry.positions) &&
    entry.positions.length > 0;

  if (hasPositions) {
    return (
      <NestedExperienceFields
        entry={entry}
        index={index}
        expanded={expanded}
        setExpanded={setExpanded}
        template={template}
        onChange={onChange}
      />
    );
  }

  function convertToNestedPositions() {
    const { start_date, end_date, date, highlights, ...rest } = entry;
    const firstPos: Record<string, unknown> = {
      title: stringValue(entry.position) || '',
      start_date: start_date ?? date ?? '',
      end_date: end_date ?? ''
    };
    if (Array.isArray(highlights) && highlights.length > 0) {
      firstPos.highlights = highlights;
    }
    onChange({
      ...rest,
      positions: [firstPos, createDefaultEntry(positionSubTemplate)]
    });
  }

  const [firstField, ...restFields] = filterDateFields(template.fields, entry);
  if (!firstField) {
    return null;
  }

  function switchDateScheme() {
    const scheme = activeDateScheme(entry);
    if (scheme === 'single') {
      const { date, ...rest } = entry;
      onChange({ ...rest, start_date: stringValue(date), end_date: '' });
      return;
    }
    const { start_date, end_date, ...rest } = entry;
    onChange({ ...rest, date: stringValue(start_date) });
  }

  return (
    <div className="-ml-0.5 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-1">
      <button type="button" aria-label="Toggle entry details" className="form-touch-hit row-start-1" onClick={() => setExpanded((value) => !value)}>
        <ChevronRight
          className={`mt-[9px] size-3.5 text-muted-foreground/60 transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </button>
      <div className="col-start-2 row-start-1">
        <FieldControl
          field={firstField}
          value={getNestedValue(entry, firstField.path)}
          onChange={(nextValue) => updateField(firstField.path, nextValue)}
        />
        {expanded && restFields.length > 0 ? (
          <div className="pb-2">
            <Divider />
            {restFields.map((field, fieldIndex) => (
              <Fragment key={`${index}-${field.path.join('.')}`}>
                <FieldControl
                  field={field}
                  value={getNestedValue(entry, field.path)}
                  onChange={(nextValue) => updateField(field.path, nextValue)}
                />
                {fieldIndex < restFields.length - 1 ? <Divider /> : null}
              </Fragment>
            ))}
            {hasDateFields(template.fields) ? (
              <>
                <Divider />
                <button
                  type="button"
                  className="form-touch-inline mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/50 transition-colors hover:text-foreground"
                  onClick={switchDateScheme}
                >
                  {activeDateScheme(entry) === 'single'
                    ? 'Use a start and end date instead'
                    : 'Use a single date instead'}
                </button>
              </>
            ) : null}
            {template.name === 'experience' ? (
              <>
                <Divider />
                <button
                  type="button"
                  className="form-touch-inline mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/50 transition-colors hover:text-foreground"
                  onClick={convertToNestedPositions}
                >
                  <Plus className="size-3" />
                  Add Sub-Position
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NestedExperienceFields({
  entry,
  index,
  expanded,
  setExpanded,
  template,
  onChange
}: {
  entry: Record<string, unknown>;
  index: number;
  expanded: boolean;
  setExpanded: (value: boolean | ((prev: boolean) => boolean)) => void;
  template: EntryTemplate;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const positions = asArray(entry.positions);
  const companyLevelPaths = ['company', 'position', 'location', 'summary'];
  const companyFields = template.fields.filter((f) => companyLevelPaths.includes(f.path[0]!));
  const [firstField, ...restCompanyFields] = companyFields;

  if (!firstField) return null;

  function updateField(path: string[], nextValue: unknown) {
    onChange(updateEntryField(entry, path, nextValue));
  }

  function updatePositions(nextPositions: unknown[]) {
    onChange({ ...entry, positions: nextPositions });
  }

  function addPosition() {
    updatePositions([...positions, createDefaultEntry(positionSubTemplate)]);
  }

  function updatePosition(posIndex: number, value: unknown) {
    const next = [...positions];
    next[posIndex] = value;
    updatePositions(next);
  }

  function removePosition(posIndex: number) {
    const next = positions.filter((_, i) => i !== posIndex);
    if (next.length === 0) {
      const flat = { ...entry };
      delete (flat as Record<string, unknown>).positions;
      onChange(flat);
    } else {
      updatePositions(next);
    }
  }

  function movePosition(posIndex: number, direction: -1 | 1) {
    const nextIndex = posIndex + direction;
    if (nextIndex < 0 || nextIndex >= positions.length) return;
    const next = [...positions];
    const [pos] = next.splice(posIndex, 1);
    next.splice(nextIndex, 0, pos);
    updatePositions(next);
  }

  const posLabelWidth = labelWidthForFields(positionSubTemplate.fields);

  return (
    <div className="-ml-0.5 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-1">
      <button type="button" aria-label="Toggle entry details" className="form-touch-hit row-start-1" onClick={() => setExpanded((v) => !v)}>
        <ChevronRight
          className={`mt-[9px] size-3.5 text-muted-foreground/60 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      <div className="col-start-2 row-start-1">
        <FieldControl
          field={firstField}
          value={getNestedValue(entry, firstField.path)}
          onChange={(nextValue) => updateField(firstField.path, nextValue)}
        />
        {expanded && (
          <div className="pb-2">
            <Divider />
            {restCompanyFields.map((field) => (
              <Fragment key={`${index}-${field.path.join('.')}`}>
                <FieldControl
                  field={field}
                  value={getNestedValue(entry, field.path)}
                  onChange={(nextValue) => updateField(field.path, nextValue)}
                />
                <Divider />
              </Fragment>
            ))}
            <div className="mt-1">
              <div className="flex items-center py-1.5">
                <span
                  className="shrink-0 text-xs font-medium text-muted-foreground"
                  style={{ width: 'var(--label-width, auto)' }}
                >
                  Positions
                </span>
                <div className="flex flex-1 items-center justify-end">
                  <button
                    type="button"
                    className="form-touch-inline flex items-center gap-0.5 text-[11px] text-muted-foreground/70 hover:text-foreground"
                    onClick={addPosition}
                  >
                    <Plus className="size-3" />
                    Add
                  </button>
                </div>
              </div>
              <div className="pl-2">
                {positions.map((pos, posIndex) => (
                  <DiffScopeProvider key={posIndex} path={['positions', posIndex]}>
                    <PositionItem
                      position={asRecord(pos)}
                      index={posIndex}
                      total={positions.length}
                      labelWidth={posLabelWidth}
                      onChange={(nextValue) => updatePosition(posIndex, nextValue)}
                      onRemove={() => removePosition(posIndex)}
                      onMove={(direction) => movePosition(posIndex, direction)}
                    />
                  </DiffScopeProvider>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PositionItem({
  position,
  index,
  total,
  labelWidth,
  onChange,
  onRemove,
  onMove
}: {
  position: Record<string, unknown>;
  index: number;
  total: number;
  labelWidth: string;
  onChange: (value: Record<string, unknown>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  function updateField(path: string[], nextValue: unknown) {
    onChange(updateEntryField(position, path, nextValue));
  }

  const [firstField, ...restFields] = positionSubTemplate.fields;
  if (!firstField) return null;

  return (
    <div
      className="relative border-b border-border/25 last:border-b-0"
      style={{ '--label-width': labelWidth } as CSSProperties}
    >
      <div className="form-item-control absolute top-2 right-0 flex items-center gap-1">
        {index > 0 && (
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-muted hover:text-foreground sm:size-5 sm:rounded sm:text-muted-foreground/40 sm:hover:bg-transparent"
            onClick={() => onMove(-1)}
            aria-label="Move position up"
          >
            <ArrowUp className="size-3.5 sm:size-2.5" />
          </button>
        )}
        {index < total - 1 && (
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-muted hover:text-foreground sm:size-5 sm:rounded sm:text-muted-foreground/40 sm:hover:bg-transparent"
            onClick={() => onMove(1)}
            aria-label="Move position down"
          >
            <ArrowDown className="size-3.5 sm:size-2.5" />
          </button>
        )}
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-muted hover:text-destructive sm:size-5 sm:rounded sm:text-muted-foreground/40 sm:hover:bg-transparent"
          onClick={onRemove}
          aria-label="Remove position"
        >
          <X className="size-3.5 sm:size-2.5" />
        </button>
      </div>
      <div className="-ml-0.5 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-1">
        <button type="button" aria-label="Toggle entry details" className="form-touch-hit row-start-1" onClick={() => setExpanded((v) => !v)}>
          <ChevronRight
            className={`mt-[9px] size-3.5 text-muted-foreground/60 transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </button>
        <div className="col-start-2 row-start-1 pr-16 sm:pr-14">
          <FieldControl
            field={firstField}
            value={getNestedValue(position, firstField.path)}
            onChange={(nextValue) => updateField(firstField.path, nextValue)}
          />
          {expanded && restFields.length > 0 && (
            <div className="pb-2">
              <Divider />
              {restFields.map((field, fieldIndex) => (
                <Fragment key={field.path.join('.')}>
                  <FieldControl
                    field={field}
                    value={getNestedValue(position, field.path)}
                    onChange={(nextValue) => updateField(field.path, nextValue)}
                  />
                  {fieldIndex < restFields.length - 1 ? <Divider /> : null}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
