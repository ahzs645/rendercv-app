import { useEffect, useRef, useState } from 'react';
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
import { GripVertical, Plus, X } from 'lucide-react';
import type { FieldDef } from './schema/types';
import { TextRow } from './primitives';

function getFlavorsInfo(value: unknown): {
  flavorKeys: string[];
  flavorsObj: Record<string, unknown> | null;
} {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (obj.flavors && typeof obj.flavors === 'object' && !Array.isArray(obj.flavors)) {
      const flavorsObj = obj.flavors as Record<string, unknown>;
      const keys = Object.keys(flavorsObj);
      if (keys.length > 0) {
        return { flavorKeys: keys, flavorsObj };
      }
    }
  }
  return { flavorKeys: [], flavorsObj: null };
}

function getFlavorItems(value: unknown, flavorKey: string): string[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (obj.flavors && typeof obj.flavors === 'object') {
      const flavors = obj.flavors as Record<string, unknown>;
      const list = flavors[flavorKey];
      if (Array.isArray(list)) {
        return list.map((item) => String(item));
      }
    }
  }
  return [];
}

function SortableStringItem({
  id,
  item,
  index,
  onUpdate,
  onRemove,
  placeholder
}: {
  id: number;
  item: string;
  index: number;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
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
      <div className="form-item-wrapper relative -mx-7 border-b border-border/25 px-7 last:border-b-0">
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
          <TextRow
            value={item}
            onChange={(nextValue) => onUpdate(index, nextValue)}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
}

export function StringListRow({
  field,
  value,
  onChange
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { flavorKeys, flavorsObj } = getFlavorsInfo(value);
  const hasFlavors = flavorKeys.length > 0;
  const [activeFlavor, setActiveFlavor] = useState(hasFlavors ? flavorKeys[0]! : '');

  const items = hasFlavors
    ? getFlavorItems(value, activeFlavor)
    : Array.isArray(value)
      ? value.map((item) => String(item))
      : [];

  const nextIdRef = useRef(0);
  const [itemIds, setItemIds] = useState<number[]>(() =>
    items.map(() => nextIdRef.current++)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  // Sync IDs when items length changes externally
  useEffect(() => {
    if (itemIds.length !== items.length) {
      setItemIds(items.map(() => nextIdRef.current++));
    }
  }, [items.length]);

  // Reset IDs when active flavor changes
  useEffect(() => {
    setItemIds(items.map(() => nextIdRef.current++));
  }, [activeFlavor]);

  function commitItems(nextItems: string[]) {
    if (hasFlavors) {
      const obj = value as Record<string, unknown>;
      const flavors = { ...(obj.flavors as Record<string, unknown>), [activeFlavor]: nextItems };
      onChange({ ...obj, flavors });
    } else {
      onChange(nextItems);
    }
  }

  function addItem() {
    setItemIds(prev => [...prev, nextIdRef.current++]);
    commitItems([...items, '']);
  }

  function addFlavor() {
    const obj = (value && typeof value === 'object' && !Array.isArray(value))
      ? value as Record<string, unknown>
      : {};
    const existingFlavors = (obj.flavors && typeof obj.flavors === 'object')
      ? obj.flavors as Record<string, unknown>
      : {};

    let baseName = 'new_flavor';
    let newKey = baseName;
    let counter = 2;
    while (Object.hasOwn(existingFlavors, newKey)) {
      newKey = `${baseName}_${counter}`;
      counter += 1;
    }

    const nextFlavors = { ...existingFlavors, [newKey]: [] };

    if (!hasFlavors && Array.isArray(value) && value.length > 0) {
      onChange({ flavors: { default: value, [newKey]: [] } });
    } else {
      onChange({ ...obj, flavors: nextFlavors });
    }
    setActiveFlavor(newKey);
  }

  function removeFlavor(key: string) {
    if (!hasFlavors || !flavorsObj) return;
    const nextFlavors = { ...flavorsObj };
    delete nextFlavors[key];
    const remainingKeys = Object.keys(nextFlavors);

    if (remainingKeys.length === 0) {
      onChange([]);
    } else if (remainingKeys.length === 1) {
      const lastList = nextFlavors[remainingKeys[0]!];
      onChange(Array.isArray(lastList) ? lastList : []);
    } else {
      const obj = value as Record<string, unknown>;
      onChange({ ...obj, flavors: nextFlavors });
      if (activeFlavor === key) {
        setActiveFlavor(remainingKeys[0]!);
      }
    }
  }

  function renameFlavor(oldKey: string, newKey: string) {
    if (!hasFlavors || !flavorsObj || !newKey || newKey === oldKey) return;
    const sanitized = newKey.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!sanitized || sanitized === oldKey || Object.hasOwn(flavorsObj, sanitized)) return;
    const nextFlavors: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(flavorsObj)) {
      nextFlavors[k === oldKey ? sanitized : k] = v;
    }
    const obj = value as Record<string, unknown>;
    onChange({ ...obj, flavors: nextFlavors });
    if (activeFlavor === oldKey) {
      setActiveFlavor(sanitized);
    }
  }

  function updateItem(index: number, nextValue: string) {
    commitItems(items.map((item, currentIndex) => (currentIndex === index ? nextValue : item)));
  }

  function removeItem(index: number) {
    setItemIds(prev => prev.filter((_, i) => i !== index));
    commitItems(items.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = itemIds.indexOf(Number(active.id));
    const newIndex = itemIds.indexOf(Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    setItemIds(prev => arrayMove(prev, oldIndex, newIndex));
    commitItems(arrayMove([...items], oldIndex, newIndex));
  }

  return (
    <>
      <div className="py-1.5">
        <div className="flex items-center">
          <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, auto)' }}>
            {field.label}
          </span>
          <div className="flex flex-1 items-center justify-end gap-2">
            {hasFlavors && (
              <div className="flex items-center gap-0.5 overflow-x-auto">
                {flavorKeys.map((key) => (
                  <FlavorTab
                    key={key}
                    flavorKey={key}
                    isActive={activeFlavor === key}
                    onSelect={() => setActiveFlavor(key)}
                    onRename={(newKey) => renameFlavor(key, newKey)}
                    onRemove={flavorKeys.length > 1 ? () => removeFlavor(key) : undefined}
                  />
                ))}
                <button
                  type="button"
                  className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground"
                  onClick={addFlavor}
                  aria-label="Add flavor"
                >
                  <Plus className="size-2.5" />
                </button>
              </div>
            )}
            {!hasFlavors && (
              <button
                type="button"
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground/40 transition-colors hover:text-foreground"
                onClick={addFlavor}
                title="Add flavor variants"
              >
                <Plus className="size-2.5" />
                Flavor
              </button>
            )}
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
        {items.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              {items.map((item, index) => (
                <SortableStringItem
                  key={itemIds[index]}
                  id={itemIds[index]!}
                  item={item}
                  index={index}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  placeholder={field.placeholder}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : null}
      </div>
    </>
  );
}

function FlavorTab({
  flavorKey,
  isActive,
  onSelect,
  onRename,
  onRemove
}: {
  flavorKey: string;
  isActive: boolean;
  onSelect: () => void;
  onRename: (newKey: string) => void;
  onRemove?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(flavorKey);

  function commitRename() {
    setEditing(false);
    if (editValue.trim() && editValue.trim() !== flavorKey) {
      onRename(editValue.trim());
    } else {
      setEditValue(flavorKey);
    }
  }

  const label = flavorKey.replace(/_/g, ' ');

  if (editing) {
    return (
      <input
        className="h-5 w-20 rounded border border-primary/40 bg-transparent px-1.5 text-[10px] outline-none"
        value={editValue}
        autoFocus
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitRename();
          if (e.key === 'Escape') {
            setEditValue(flavorKey);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className={`group/flavor relative flex h-5 shrink-0 items-center rounded px-1.5 text-[10px] font-medium transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground/60 hover:bg-muted hover:text-foreground'
      }`}
      onClick={onSelect}
      onDoubleClick={() => {
        setEditValue(flavorKey);
        setEditing(true);
      }}
    >
      {label}
      {onRemove && isActive ? (
        <span
          role="button"
          tabIndex={0}
          className="ml-1 -mr-0.5 flex size-3 items-center justify-center rounded-full text-muted-foreground/50 hover:bg-destructive/20 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onRemove();
            }
          }}
          aria-label={`Remove ${label} flavor`}
        >
          <X className="size-2" />
        </span>
      ) : null}
    </button>
  );
}
