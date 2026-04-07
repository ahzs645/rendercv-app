import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
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
    <article className="form-section" data-section-key={sectionKey}>
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
