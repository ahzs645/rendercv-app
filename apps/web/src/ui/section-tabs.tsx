import type { SectionKey } from '@rendercv/contracts';
import { SECTION_LABELS } from '@rendercv/contracts';

export function SectionTabs({
  active,
  onSelect
}: {
  active: SectionKey;
  onSelect: (section: SectionKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(SECTION_LABELS) as SectionKey[]).map((section) => (
        <button
          key={section}
          className={`rounded-full px-3 py-1 text-sm ${active === section ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          onClick={() => onSelect(section)}
        >
          {SECTION_LABELS[section]}
        </button>
      ))}
    </div>
  );
}
