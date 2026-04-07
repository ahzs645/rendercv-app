import { Fragment, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
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
  GripVertical,
  Plus,
  X
} from 'lucide-react';
import {
  createDefaultEntry,
  positionSubTemplate
} from './schema/entry-templates';
import type { EntryTemplate, FieldDef } from './schema/types';
import { FieldControl } from './field-controls';
import { TextRow, Divider } from './primitives';
import {
  asRecord,
  asArray,
  getNestedValue,
  updateEntryField,
  stringValue,
  labelWidthForFields,
  labelWidthForTemplate,
  dynamicEntryMarker,
  entryAddLabel
} from './utils';

export function EntryArrayEditor({
  title,
  entries,
  entriesExpanded = true,
  template,
  onChange,
  showHeader = true,
  addLabel,
  sectionKey
}: {
  title: string;
  entries: unknown[];
  entriesExpanded?: boolean;
  template: EntryTemplate | 'text';
  onChange: (entries: unknown[]) => void;
  showHeader?: boolean;
  addLabel?: string;
  sectionKey?: string;
}) {
  const labelWidth = labelWidthForTemplate(template);
  const nextIdRef = useRef(0);
  const [itemIds, setItemIds] = useState<number[]>(() =>
    entries.map(() => nextIdRef.current++)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  useEffect(() => {
    if (itemIds.length !== entries.length) {
      setItemIds(entries.map(() => nextIdRef.current++));
    }
  }, [entries.length]);

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
      template={template}
      sectionKey={sectionKey}
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
                  className="flex items-center gap-0.5 text-[11px] text-muted-foreground/70 hover:text-foreground"
                  onClick={addEntry}
                  type="button"
                >
                  <Plus className="size-3" />
                  Add
                </button>
              </div>
            </div>
          </div>
          <div className="pl-4">
            {entries.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                  <div>{entryList}</div>
                </SortableContext>
              </DndContext>
            ) : null}
          </div>
          <Divider />
        </>
      ) : null}
      {!showHeader ? (
        <div className="pl-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              {entryList}
            </SortableContext>
          </DndContext>
          <button
            type="button"
            className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/50 transition-colors hover:text-foreground"
            onClick={addEntry}
          >
            <Plus className="size-3" />
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
  sectionKey
}: {
  id: number;
  entry: unknown;
  index: number;
  entriesLength: number;
  entriesExpanded: boolean;
  template: EntryTemplate | 'text';
  onChange: (index: number, value: unknown) => void;
  onRemove: (index: number) => void;
  sectionKey?: string;
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

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} data-section-key={sectionKey} data-entry-index={index}>
      <div className="form-item-wrapper relative -mx-7 px-7">
        <div
          ref={setActivatorNodeRef}
          {...listeners}
          className="form-item-control absolute top-1/2 left-1 -translate-y-1/2 cursor-grab touch-none text-muted-foreground/40 active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </div>
        <button
          type="button"
          className="form-item-control absolute top-1/2 right-3 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground/50 hover:text-destructive"
          onClick={() => onRemove(index)}
          aria-label="Remove"
        >
          <X className="size-3" />
        </button>
        <div className="pr-5">
          {template === 'text' ? (
            <TextRow
              value={typeof entry === 'string' ? entry : ''}
              onChange={(nextValue) => onChange(index, nextValue)}
              placeholder="Enter text..."
            />
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
    </div>
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

    return (
      <div style={{ '--label-width': labelWidthForTemplate(template) } as CSSProperties}>
        {template.fields.map((field, fieldIndex) => (
          <Fragment key={`${index}-${field.path.join('.')}`}>
            <FieldControl
              field={field}
              value={getNestedValue(entry, field.path)}
              onChange={(nextValue) => updateField(field.path, nextValue)}
            />
            {fieldIndex < template.fields.length - 1 ? <Divider /> : null}
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

  const [firstField, ...restFields] = template.fields;
  if (!firstField) {
    return null;
  }

  return (
    <div className="-ml-0.5 grid grid-cols-[auto_1fr] items-start gap-x-1">
      <button type="button" className="row-start-1" onClick={() => setExpanded((value) => !value)}>
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
            {template.name === 'experience' ? (
              <>
                <Divider />
                <button
                  type="button"
                  className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/50 transition-colors hover:text-foreground"
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
    <div className="-ml-0.5 grid grid-cols-[auto_1fr] items-start gap-x-1">
      <button type="button" className="row-start-1" onClick={() => setExpanded((v) => !v)}>
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
                    className="flex items-center gap-0.5 text-[11px] text-muted-foreground/70 hover:text-foreground"
                    onClick={addPosition}
                  >
                    <Plus className="size-3" />
                    Add
                  </button>
                </div>
              </div>
              <div className="pl-2">
                {positions.map((pos, posIndex) => (
                  <PositionItem
                    key={posIndex}
                    position={asRecord(pos)}
                    index={posIndex}
                    total={positions.length}
                    labelWidth={posLabelWidth}
                    onChange={(nextValue) => updatePosition(posIndex, nextValue)}
                    onRemove={() => removePosition(posIndex)}
                    onMove={(direction) => movePosition(posIndex, direction)}
                  />
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
      <div className="form-item-control absolute top-1.5 right-0 flex items-center gap-0.5">
        {index > 0 && (
          <button
            type="button"
            className="flex size-4 items-center justify-center text-muted-foreground/40 hover:text-foreground"
            onClick={() => onMove(-1)}
            aria-label="Move position up"
          >
            <ArrowUp className="size-2.5" />
          </button>
        )}
        {index < total - 1 && (
          <button
            type="button"
            className="flex size-4 items-center justify-center text-muted-foreground/40 hover:text-foreground"
            onClick={() => onMove(1)}
            aria-label="Move position down"
          >
            <ArrowDown className="size-2.5" />
          </button>
        )}
        <button
          type="button"
          className="flex size-4 items-center justify-center text-muted-foreground/40 hover:text-destructive"
          onClick={onRemove}
          aria-label="Remove position"
        >
          <X className="size-2.5" />
        </button>
      </div>
      <div className="-ml-0.5 grid grid-cols-[auto_1fr] items-start gap-x-1">
        <button type="button" className="row-start-1" onClick={() => setExpanded((v) => !v)}>
          <ChevronRight
            className={`mt-[9px] size-3.5 text-muted-foreground/60 transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </button>
        <div className="col-start-2 row-start-1 pr-14">
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
