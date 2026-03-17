import { Fragment, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ComponentType } from 'react';
import type { SectionKey } from '@rendercv/contracts';
import YAML from 'yaml';
import { localeLabel, preferencesStore, themeLabel } from '@rendercv/core';
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
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  GripVertical,
  Plus,
  X
} from 'lucide-react';
import {
  customConnectionTemplate,
  cvPersonalInfoGroup,
  socialNetworkTemplate
} from './schema/cv-schema';
import { designSchema } from './schema/design-schema';
import { localeSchema } from './schema/locale-schema';
import { settingsSchema } from './schema/settings-schema';
import {
  createDefaultEntry,
  detectEntryType,
  entryTypeOptions,
  findTemplateByName,
  positionSubTemplate
} from './schema/entry-templates';
import type { EntryTemplate, FieldDef, SectionSchema, SelectOption } from './schema/types';
import { useStore } from '../../lib/use-store';

const FONT_OPTIONS = [
  'DejaVu Sans Mono',
  'EB Garamond',
  'Fontin',
  'Gentium Book Plus',
  'Lato',
  'Libertinus Serif',
  'Mukta',
  'New Computer Modern',
  'Noto Sans',
  'Open Sans',
  'Open Sauce Sans',
  'Poppins',
  'Raleway',
  'Roboto',
  'Source Sans 3',
  'Ubuntu',
  'XCharter'
];

export function FormEditor({
  section,
  value,
  onChange
}: {
  section: SectionKey;
  value: string;
  onChange: (value: string) => void;
}) {
  const preferences = useStore(preferencesStore);
  const schema = getSchema(section);

  let documentValue: Record<string, unknown>;
  try {
    documentValue = (YAML.parse(value || `${section}:\n`) ?? {}) as Record<string, unknown>;
  } catch {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-destructive">
        The current YAML cannot be parsed into a form. Switch back to YAML mode to fix it.
      </div>
    );
  }

  const rootValue = (documentValue[section] as Record<string, unknown> | undefined) ?? {};

  function updateField(path: string[], nextValue: unknown) {
    const draft = structuredClone(documentValue);
    const root = ((draft[section] as Record<string, unknown> | undefined) ??= {});
    setNestedValue(root, path, normalizeFieldValue(nextValue));
    onChange(YAML.stringify(draft));
  }

  function updateRoot(nextRootValue: Record<string, unknown>) {
    const draft = structuredClone(documentValue);
    draft[section] = nextRootValue;
    onChange(YAML.stringify(draft));
  }

  return (
    <div className="h-full overflow-y-auto px-8 [overflow-anchor:none]" data-form-editor>
      {schema ? (
        schema.groups.map((group) => (
          <section key={group.title || group.fields.map((field) => field.path.join('.')).join('|')}>
            {group.title ? (
              <h3 className="mt-6 mb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                {group.title}
              </h3>
            ) : null}
            <div style={{ '--label-width': labelWidthForFields(group.fields) } as CSSProperties}>
              {group.fields.map((field) => {
                const fieldValue = getNestedValue(rootValue, field.path);
                return (
                  <Fragment key={field.path.join('.')}>
                    <FieldControl
                      field={field}
                      value={fieldValue}
                      onChange={(nextValue) => updateField(field.path, nextValue)}
                    />
                    <Divider />
                    {field.description ? <FieldDescription description={field.description} /> : null}
                  </Fragment>
                );
              })}
            </div>
          </section>
        ))
      ) : null}
      {section === 'cv' ? (
        <CvSectionEditor
          entriesExpanded={preferences.entriesExpanded}
          rootValue={rootValue}
          onChange={updateRoot}
        />
      ) : null}
    </div>
  );
}

function getSchema(section: SectionKey): SectionSchema | null {
  switch (section) {
    case 'design':
      return designSchema;
    case 'locale':
      return localeSchema;
    case 'settings':
      return settingsSchema;
    case 'cv':
      return { groups: [cvPersonalInfoGroup] };
    default:
      return null;
  }
}

function CvSectionEditor({
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
      />
      <EntryArrayEditor
        title="Custom Connections"
        entries={customConnections}
        entriesExpanded={entriesExpanded}
        template={customConnectionTemplate}
        onChange={(nextEntries) => updateCvField('custom_connections', nextEntries)}
      />
      <SectionMapEditor entriesExpanded={entriesExpanded} sections={sections} onChange={updateSections} />
    </>
  );
}

function EntryArrayEditor({
  title,
  entries,
  entriesExpanded = true,
  template,
  onChange,
  showHeader = true,
  addLabel
}: {
  title: string;
  entries: unknown[];
  entriesExpanded?: boolean;
  template: EntryTemplate | 'text';
  onChange: (entries: unknown[]) => void;
  showHeader?: boolean;
  addLabel?: string;
}) {
  const labelWidth = labelWidthForTemplate(template);
  const nextIdRef = useRef(0);
  const [itemIds, setItemIds] = useState<number[]>(() =>
    entries.map(() => nextIdRef.current++)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  // Sync IDs when entries length changes externally (e.g., YAML edit)
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

  function moveSection(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sectionEntries.length) {
      return;
    }
    onChange(moveRecordEntry(sections, index, nextIndex));
  }

  function updateSectionEntries(sectionKey: string, nextEntries: unknown[]) {
    onChange({
      ...sections,
      [sectionKey]: nextEntries
    });
  }

  return (
    <section>
      {sectionEntries.map(([sectionKey, sectionValue], index) => (
        <SectionEditor
          key={sectionKey}
          index={index}
          total={sectionEntries.length}
          sectionKey={sectionKey}
          entries={asArray(sectionValue)}
          entriesExpanded={entriesExpanded}
          onDelete={() => deleteSection(sectionKey)}
          onMove={(direction) => moveSection(index, direction)}
          onRename={renameSection}
          onChangeEntries={(nextEntries) => updateSectionEntries(sectionKey, nextEntries)}
        />
      ))}
      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 py-2.5 text-xs text-muted-foreground/70 transition-colors hover:border-border hover:text-foreground"
        onClick={addSection}
      >
        <Plus className="size-3.5" />
        Add New Section
      </button>
      <div className="h-[20vh]" />
    </section>
  );
}

function SectionEditor({
  sectionKey,
  entries,
  entriesExpanded,
  index,
  total,
  onRename,
  onDelete,
  onMove,
  onChangeEntries
}: {
  sectionKey: string;
  entries: unknown[];
  entriesExpanded: boolean;
  index: number;
  total: number;
  onRename: (oldKey: string, nextTitle: string) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onChangeEntries: (entries: unknown[]) => void;
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
    <article className="form-section">
      <div className="group/section relative -mx-7 mt-3 mb-1 flex items-center px-7">
        <div className="absolute top-1/2 left-1 flex -translate-y-1/2 flex-col opacity-100 transition-opacity md:opacity-0 md:group-hover/section:opacity-100">
          <button
            type="button"
            aria-label="Move section up"
            className={`flex size-4 items-center justify-center text-muted-foreground/50 hover:text-foreground ${index === 0 ? 'invisible' : ''}`}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="size-3" />
          </button>
          <button
            type="button"
            aria-label="Move section down"
            className={`flex size-4 items-center justify-center text-muted-foreground/50 hover:text-foreground ${index === total - 1 ? 'invisible' : ''}`}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="size-3" />
          </button>
        </div>
        <input
          className="flex-1 border-b border-muted-foreground/40 bg-transparent font-semibold text-foreground/80 outline-none"
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
          className="absolute top-1/2 right-1 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground/50 opacity-100 transition-opacity hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 md:opacity-0 md:group-hover/section:opacity-100"
          aria-label="Delete section"
          onClick={onDelete}
        >
          <X className="size-3" />
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
        />
      )}
    </article>
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
  onRemove
}: {
  id: number;
  entry: unknown;
  index: number;
  entriesLength: number;
  entriesExpanded: boolean;
  template: EntryTemplate | 'text';
  onChange: (index: number, value: unknown) => void;
  onRemove: (index: number) => void;
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
    <div ref={setNodeRef} style={style} {...attributes}>
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

  // Handle nested positions for experience entries
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
      // Convert back to flat: move first position data up, remove positions key
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

function EntryTypeChooser({ onChoose }: { onChoose: (entryType: string) => void }) {
  return (
    <div className="flex flex-col gap-2 pt-1 pb-3 pl-4">
      <p className="text-[11px] tracking-wider text-muted-foreground/50 uppercase">Entry type</p>
      <div className="flex flex-wrap gap-1">
        {entryTypeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className="rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => onChoose(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type ChoiceOption = SelectOption & {
  icon?: ComponentType<{ className?: string }>;
};

function FieldDescription({ description }: { description: string }) {
  return (
    <p
      className="py-0.5 text-[11px] text-muted-foreground/70 select-text"
      style={{ paddingLeft: 'var(--label-width, 8rem)' }}
    >
      {description}
    </p>
  );
}

function ToggleButtonsRow({
  label,
  value,
  options,
  onChange,
  square = false
}: {
  label: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
  square?: boolean;
}) {
  return (
    <div className="flex items-center py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-0.5">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex h-6 items-center rounded transition-colors ${
                square
                  ? 'w-6 justify-center text-xs'
                  : Icon
                    ? 'gap-1 px-1.5 text-[10px]'
                    : 'px-2 text-[11px]'
              } ${
                value === option.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={() => onChange(option.value)}
              title={Icon ? option.label : undefined}
            >
              {Icon ? <Icon className="size-3.5" /> : option.label}
              {Icon && option.extra ? <span className="text-[9px] leading-none">{option.extra}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CollapsibleChoiceRow({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(!value);

  useEffect(() => {
    setExpanded(!value);
  }, [value]);

  return (
    <div className="flex items-center py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1">
          {options
            .filter((option) => expanded || !value || option.value === value)
            .map((option) => (
              <button
                key={option.value}
                type="button"
                data-value={option.value}
                className={`flex h-6 items-center whitespace-nowrap transition-[color,background-color,opacity,border-radius,font-size,padding] duration-[100ms] ${
                  !expanded && value === option.value && value
                    ? 'cursor-pointer rounded-none bg-transparent px-0 text-sm text-foreground hover:text-primary'
                    : value === option.value
                      ? 'rounded bg-primary/10 px-2 text-[11px] text-primary'
                      : 'rounded px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => {
                  if (!expanded) {
                    setExpanded(true);
                    return;
                  }

                  if (option.value === value) {
                    setExpanded(false);
                    return;
                  }

                  onChange(option.value);
                  setExpanded(false);
                }}
              >
                {option.label}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

const DIMENSION_UNITS = ['cm', 'mm', 'in', 'pt', 'em', 'ex'] as const;

function DimensionRow({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [num, setNum] = useState('0');
  const [unit, setUnit] = useState<(typeof DIMENSION_UNITS)[number]>('cm');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const parsed = parseDimensionValue(value);
    setNum(parsed.num);
    setUnit(parsed.unit);
  }, [value]);

  function commit(nextNum: string, nextUnit: (typeof DIMENSION_UNITS)[number]) {
    onChange(`${nextNum || '0'}${nextUnit}`);
  }

  return (
    <div className="flex items-center gap-1 py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <div className="relative flex">
        <span className="invisible absolute text-sm whitespace-pre" aria-hidden="true">
          {num || '0'}
        </span>
        <input
          type="number"
          step="0.01"
          className="[appearance:textfield] bg-transparent text-sm outline-none select-text placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none cursor-ew-resize"
          style={{ width: `${Math.max((num || '0').length * 0.62 + 0.5, 0.75)}rem` }}
          value={num}
          onChange={(event) => {
            const nextNum = event.target.value;
            setNum(nextNum);
            commit(nextNum, unit);
          }}
          onBlur={() => {
            if (!num) {
              setNum('0');
              commit('0', unit);
            }
          }}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {(expanded ? DIMENSION_UNITS : [unit]).map((optionUnit) => (
          <button
            key={optionUnit}
            type="button"
            data-value={optionUnit}
            className={`flex py-0 whitespace-nowrap transition-[color,background-color,opacity,border-radius,font-size,padding] duration-[100ms] ${
              !expanded && optionUnit === unit
                ? 'cursor-pointer rounded-none bg-transparent px-0 text-sm text-foreground hover:text-primary'
                : optionUnit === unit
                  ? 'rounded bg-primary/10 px-2 text-[11px] text-primary'
                  : 'rounded px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => {
              if (!expanded) {
                setExpanded(true);
                return;
              }

              if (optionUnit === unit) {
                setExpanded(false);
                return;
              }

              setUnit(optionUnit);
              commit(num, optionUnit);
              setExpanded(false);
            }}
          >
            {optionUnit}
          </button>
        ))}
      </div>
    </div>
  );
}

function BooleanRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all outline-none ${
          checked ? 'bg-primary' : 'bg-input'
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`block size-4 rounded-full bg-background transition-transform ${
            checked ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const swatchValue = asHexColor(value);

  return (
    <div className="flex items-center py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <button
        type="button"
        className="size-5 shrink-0 cursor-pointer rounded-full border border-border/60"
        aria-label="Pick color"
        style={{ backgroundColor: swatchValue }}
        onClick={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        type="color"
        className="sr-only"
        value={swatchValue}
        onChange={(event) => onChange(event.target.value)}
      />
      <input
        type="text"
        placeholder="#000000"
        className="ml-2 min-w-0 flex-1 bg-transparent py-0.5 font-mono text-sm outline-none select-text placeholder:text-muted-foreground/50"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SectionStyleRow({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = [
    { value: 'with_full_line', label: 'Full Line' },
    { value: 'with_partial_line', label: 'Partial Line' },
    { value: 'without_line', label: 'No Line' },
    { value: 'moderncv', label: 'ModernCV' }
  ] as const;

  return (
    <div className="flex items-center py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`flex h-7 items-center gap-0.5 rounded border px-2 transition-colors ${
              value === option.value
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => onChange(option.value)}
            title={option.label}
          >
            {option.value === 'with_full_line' ? (
              <span className="flex w-5 flex-col items-start gap-[2px]">
                <span className="text-[9px] leading-none font-semibold">T</span>
                <span className="h-px w-full bg-current" />
              </span>
            ) : null}
            {option.value === 'with_partial_line' ? (
              <span className="flex w-5 items-end gap-[3px]">
                <span className="text-[9px] leading-none font-semibold">T</span>
                <span className="mb-[1px] h-px flex-1 bg-current" />
              </span>
            ) : null}
            {option.value === 'without_line' ? (
              <span className="text-[9px] leading-none font-semibold">T</span>
            ) : null}
            {option.value === 'moderncv' ? (
              <span className="flex items-center gap-[3px]">
                <span className="h-[1px] w-2.5 rounded-[0.5px] bg-current" />
                <span className="text-[9px] leading-none font-semibold">T</span>
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.type) {
    case 'boolean':
      return <BooleanRow label={field.label} checked={Boolean(value)} onChange={onChange} />;
    case 'string_list':
      return <StringListRow field={field} value={value} onChange={onChange} />;
    case 'dimension':
      return <DimensionRow label={field.label} value={stringValue(value)} onChange={onChange} />;
    case 'color':
      return <ColorRow label={field.label} value={stringValue(value) || '#000000'} onChange={onChange} />;
    case 'select':
      return (
        <CollapsibleChoiceRow
          label={field.label}
          value={stringValue(value)}
          options={resolveOptions(field)}
          onChange={onChange}
        />
      );
    case 'toggle':
      return (
        <ToggleButtonsRow
          label={field.label}
          value={stringValue(value)}
          options={resolveOptions(field)}
          onChange={onChange}
        />
      );
    case 'alignment':
    case 'bullet':
      return (
        <ToggleButtonsRow
          label={field.label}
          value={stringValue(value)}
          options={resolveOptions(field)}
          onChange={onChange}
          square={field.type === 'bullet'}
        />
      );
    case 'font':
      return (
        <CollapsibleChoiceRow
          label={field.label}
          value={stringValue(value)}
          options={resolveOptions(field)}
          onChange={onChange}
        />
      );
    case 'section_style':
      return (
        <SectionStyleRow
          label={field.label}
          value={stringValue(value)}
          onChange={onChange}
        />
      );
    default:
      return (
        <TextRow
          label={field.label}
          placeholder={field.placeholder}
          value={stringValue(value)}
          onChange={(nextValue) => onChange(nextValue)}
        />
      );
  }
}

function resolveOptions(field: FieldDef): ChoiceOption[] {
  if (Array.isArray(field.options)) {
    return field.options as ChoiceOption[];
  }

  if (field.type === 'font') {
    return (field.fonts ?? FONT_OPTIONS).map((font) => ({ value: font, label: font }));
  }

  if (field.type === 'bullet') {
    return (field.bullets ?? ['●', '•', '◦', '-', '◆', '★', '■', '—', '○']).map((value) => ({
      value,
      label: value
    }));
  }

  if (field.type === 'alignment') {
    if (field.options === 'position') {
      return [
        { value: 'left', label: 'Left', icon: AlignLeft },
        { value: 'center', label: 'Center', icon: AlignCenter },
        { value: 'right', label: 'Right', icon: AlignRight }
      ];
    }
    return [
      { value: 'left', label: 'Left', icon: AlignLeft },
      { value: 'justified', label: 'Justified', icon: AlignJustify },
      {
        value: 'justified-with-no-hyphenation',
        label: 'No hyphenation',
        icon: AlignJustify,
        extra: 'no-hyphenation'
      }
    ];
  }

  return [];
}

function getNestedValue(root: Record<string, unknown>, path: string[]) {
  let current: unknown = root;
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function updateEntryField(
  entry: Record<string, unknown>,
  path: string[],
  value: unknown
): Record<string, unknown> {
  const draft = structuredClone(entry);
  setNestedValue(draft, path, normalizeFieldValue(value));
  return draft;
}

function setNestedValue(root: Record<string, unknown>, path: string[], value: unknown) {
  let current: Record<string, unknown> | unknown[] = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index]!;
    const nextKey = path[index + 1]!;
    const nextContainer = isNumericKey(nextKey) ? [] : {};

    if (Array.isArray(current)) {
      const numericKey = Number(key);
      if (current[numericKey] == null || typeof current[numericKey] !== 'object') {
        current[numericKey] = nextContainer;
      }
      current = current[numericKey] as Record<string, unknown> | unknown[];
      continue;
    }

    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = nextContainer;
    }
    current = current[key] as Record<string, unknown> | unknown[];
  }

  const lastKey = path[path.length - 1]!;
  if (Array.isArray(current)) {
    current[Number(lastKey)] = value;
  } else {
    current[lastKey] = value;
  }
}

function normalizeFieldValue(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }
  return value ?? '';
}

function stringValue(value: unknown) {
  if (value == null) {
    return '';
  }
  return String(value);
}

function isNumericKey(value: string) {
  return /^\d+$/.test(value);
}

function Divider() {
  return <div className="h-px bg-border/40" />;
}

function TextRow({
  label,
  value,
  onChange,
  placeholder
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center py-1.5">
      {label ? (
        <span
          className="shrink-0 text-xs text-muted-foreground"
          style={{ width: 'var(--label-width, 8rem)', transition: 'color 190ms cubic-bezier(0.215, 0.61, 0.355, 1)' }}
        >
          {label}
        </span>
      ) : null}
      <textarea
        rows={1}
        className="field-sizing-content min-w-0 flex-1 resize-none bg-transparent py-0 text-sm outline-none select-text placeholder:text-muted-foreground/50"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function StringListRow({
  field,
  value,
  onChange
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const items = Array.isArray(value) ? value.map((item) => String(item)) : [];

  function addItem() {
    onChange([...items, '']);
  }

  function updateItem(index: number, nextValue: string) {
    onChange(items.map((item, currentIndex) => (currentIndex === index ? nextValue : item)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <>
      <div className="py-1.5">
        <div className="flex items-center">
          <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, auto)' }}>
            {field.label}
          </span>
          <div className="flex flex-1 items-center justify-end">
            <button
              type="button"
              className="flex items-center gap-0.5 text-[11px] text-muted-foreground/70 hover:text-foreground"
              onClick={addItem}
            >
              <Plus className="size-3" />
              Add
            </button>
          </div>
        </div>
      </div>
      <div className="pl-4">
        {items.map((item, index) => (
          <div
            key={`${field.path.join('.')}-${index}`}
            className="form-item-wrapper relative -mx-7 border-b border-border/25 px-7 last:border-b-0"
          >
            <div className="form-item-control absolute top-1/2 left-1 -translate-y-1/2 text-muted-foreground/40">
              <GripVertical className="size-3.5" />
            </div>
            <button
              type="button"
              className="form-item-control absolute top-1/2 right-3 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground/50 hover:text-destructive"
              onClick={() => removeItem(index)}
              aria-label="Remove"
            >
              <X className="size-3" />
            </button>
            <div className="pr-5">
              <TextRow
                value={item}
                onChange={(nextValue) => updateItem(index, nextValue)}
                placeholder={field.placeholder}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function resolveEntrySummary(entry: unknown, template: EntryTemplate | 'text', index: number) {
  if (template === 'text') {
    const text = typeof entry === 'string' ? entry.trim() : '';
    return text ? text.slice(0, 72) : `Text entry ${index + 1}`;
  }

  const summaryField = template.fields.find((field) => field.required) ?? template.fields[0];
  if (!summaryField) {
    return `${template.label} ${index + 1}`;
  }

  const summaryValue = getNestedValue(asRecord(entry), summaryField.path);
  const text = stringValue(summaryValue).trim();
  return text || `${template.label} ${index + 1}`;
}

function dynamicEntryMarker(templateName: string, index: number, total: number) {
  switch (templateName) {
    case 'bullet':
      return '\u2022';
    case 'numbered':
      return `${index + 1}.`;
    case 'reversed_numbered':
      return `${total - index}.`;
    default:
      return undefined;
  }
}

function parseDimensionValue(value: string) {
  const match = value.trim().match(/^(-?\d*\.?\d+|-?\d*\.?\d*)\s*(cm|mm|in|pt|em|ex)$/);
  if (match) {
    return {
      num: match[1] || '0',
      unit: match[2] as (typeof DIMENSION_UNITS)[number]
    };
  }

  return {
    num: value.trim() || '0',
    unit: 'cm' as (typeof DIMENSION_UNITS)[number]
  };
}

function asHexColor(value: string) {
  if (/^#[0-9a-f]{6}$/i.test(value.trim())) {
    return value.trim();
  }

  if (/^#[0-9a-f]{3}$/i.test(value.trim())) {
    const short = value.trim().slice(1);
    return `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`;
  }

  return '#000000';
}

function labelWidthForFields(fields: FieldDef[]) {
  const maxLength = Math.max(...fields.map((field) => field.label.length), 10);
  return `${Math.max(70, Math.round(maxLength * 7.4 + 24))}px`;
}

function labelWidthForTemplate(template: EntryTemplate | 'text') {
  if (template === 'text') {
    return '8rem';
  }

  if (template.name === 'bullet' || template.name === 'numbered' || template.name === 'reversed_numbered') {
    return '1.5rem';
  }

  return labelWidthForFields(template.fields);
}

function entryAddLabel(template: EntryTemplate | 'text') {
  if (template === 'text') {
    return 'text';
  }

  return `${template.name.replace(/_/g, ' ')} entry`;
}

function dictionaryKeyToTitle(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
    .join(' ');
}

function properSectionTitleToKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function createUniqueSectionKey(sections: Record<string, unknown>, base: string) {
  if (!Object.hasOwn(sections, base)) {
    return base;
  }

  let index = 2;
  while (Object.hasOwn(sections, `${base}_${index}`)) {
    index += 1;
  }

  return `${base}_${index}`;
}

function renameRecordKey(
  record: Record<string, unknown>,
  oldKey: string,
  nextKey: string
): Record<string, unknown> {
  const entries = Object.entries(record).map(([key, value]) =>
    key === oldKey ? [nextKey, value] : [key, value]
  );
  return Object.fromEntries(entries);
}

function removeRecordKey(record: Record<string, unknown>, keyToRemove: string) {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => key !== keyToRemove)
  );
}

function moveRecordEntry(record: Record<string, unknown>, fromIndex: number, toIndex: number) {
  const entries = Object.entries(record);
  const [entry] = entries.splice(fromIndex, 1);
  entries.splice(toIndex, 0, entry);
  return Object.fromEntries(entries);
}
