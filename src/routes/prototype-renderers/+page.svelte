<script lang="ts">
  import { mode } from 'mode-watcher';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import BrainIcon from '@lucide/svelte/icons/brain';
  import CheckIcon from '@lucide/svelte/icons/check';
  import XIcon from '@lucide/svelte/icons/x';
  import type { Component } from 'svelte';

  // ─── Types ───────────────────────────────────────────────

  type EntryKind = 'reasoning' | 'tool';

  interface ReasoningEntry {
    kind: 'reasoning';
    title: string;
    content: string;
  }

  interface ToolEntry {
    kind: 'tool';
    toolName: string;
    status: 'running' | 'done' | 'error';
    detail?: string;
  }

  type Entry = ReasoningEntry | ToolEntry;

  interface TextSegment {
    type: 'text';
    text: string;
  }

  interface ActivitySegment {
    type: 'activity';
    entries: Entry[];
  }

  type Segment = TextSegment | ActivitySegment;

  // ─── Tool icon registry ──────────────────────────────────

  const TOOL_ICONS: Record<string, Component> = {
    editYaml: PencilIcon,
    fetchUrl: GlobeIcon,
    readYaml: BookOpenIcon
  };

  const TOOL_LABELS: Record<string, string> = {
    editYaml: 'Editing CV',
    fetchUrl: 'Fetching URL',
    readYaml: 'Reading file'
  };

  // ─── Mock data ───────────────────────────────────────────

  // Gemini-style: reasoning block → tools → single response
  const geminiSegments: Segment[] = [
    {
      type: 'activity',
      entries: [
        {
          kind: 'reasoning',
          title: 'Understanding the request',
          content:
            'The user wants to update their work experience section to emphasize leadership skills. I should read the current CV first, then make targeted edits to the experience bullet points.'
        },
        {
          kind: 'reasoning',
          title: 'Planning the edits',
          content:
            'I need to modify three bullet points in the experience section. I\'ll focus on adding action verbs like "led", "managed", "directed" and quantifying achievements where possible.'
        },
        { kind: 'tool', toolName: 'readYaml', status: 'done', detail: 'cv' },
        {
          kind: 'tool',
          toolName: 'editYaml',
          status: 'done',
          detail: 'Updated 3 bullet points'
        }
      ]
    },
    {
      type: 'text',
      text: "I've updated your work experience to emphasize leadership. Here's what I changed:\n\n- **Led** a cross-functional team of 8 engineers → quantified team size\n- **Directed** the migration to microservices → stronger action verb\n- **Managed** a $2M annual budget → added financial scope"
    }
  ];

  // Claude-style: interleaved text + reasoning + tools + text
  const claudeSegments: Segment[] = [
    {
      type: 'text',
      text: 'Let me take a look at your CV and update the experience section with stronger leadership language.'
    },
    {
      type: 'activity',
      entries: [
        {
          kind: 'reasoning',
          title: 'Analyzing current content',
          content:
            'Looking at the CV YAML, the experience section has generic descriptions. I should read the full content first to understand the structure before making changes.'
        },
        { kind: 'tool', toolName: 'readYaml', status: 'done', detail: 'cv' },
        {
          kind: 'reasoning',
          title: 'Planning targeted edits',
          content:
            'The experience entries use passive voice. I\'ll convert to active leadership verbs and add metrics. Three edits needed for the "Software Engineer" role.'
        },
        {
          kind: 'tool',
          toolName: 'editYaml',
          status: 'done',
          detail: 'Updated bullet 1'
        },
        {
          kind: 'tool',
          toolName: 'editYaml',
          status: 'done',
          detail: 'Updated bullet 2'
        }
      ]
    },
    {
      type: 'text',
      text: "Done! I've strengthened the language across your experience entries. The changes emphasize **leadership**, **scope**, and **measurable outcomes**."
    }
  ];

  // Streaming simulation (in-progress)
  const streamingSegments: Segment[] = [
    {
      type: 'text',
      text: "I'll update your CV based on that job posting."
    },
    {
      type: 'activity',
      entries: [
        { kind: 'tool', toolName: 'fetchUrl', status: 'done', detail: 'https://example.com/job' },
        {
          kind: 'reasoning',
          title: 'Matching skills to requirements',
          content:
            'The job posting emphasizes distributed systems, Kubernetes, and team leadership. The CV already mentions some of these but needs stronger alignment.'
        },
        { kind: 'tool', toolName: 'readYaml', status: 'done', detail: 'cv' },
        {
          kind: 'tool',
          toolName: 'editYaml',
          status: 'running',
          detail: 'Updating skills section'
        }
      ]
    }
  ];

  // Tool error scenario
  const errorSegments: Segment[] = [
    {
      type: 'activity',
      entries: [
        {
          kind: 'reasoning',
          title: 'Processing request',
          content: 'The user wants to add a new education entry. Let me edit the CV file.'
        },
        {
          kind: 'tool',
          toolName: 'editYaml',
          status: 'error',
          detail: 'Validation failed: invalid date format'
        },
        {
          kind: 'reasoning',
          title: 'Fixing the date format',
          content: 'The date format needs to be YYYY-MM. Let me retry with the correct format.'
        },
        { kind: 'tool', toolName: 'editYaml', status: 'done', detail: 'Retried with correct date' }
      ]
    },
    {
      type: 'text',
      text: 'Added the education entry. I had to fix the date format — RenderCV expects `YYYY-MM`.'
    }
  ];

  type Scenario = {
    label: string;
    segments: Segment[];
    streaming: boolean;
  };

  const scenarios: Scenario[] = [
    { label: 'Gemini-style (reason → act → respond)', segments: geminiSegments, streaming: false },
    { label: 'Claude-style (interleaved)', segments: claudeSegments, streaming: false },
    { label: 'Streaming (in-progress)', segments: streamingSegments, streaming: true },
    { label: 'Error recovery', segments: errorSegments, streaming: false }
  ];

  // ─── Collapsible state management ───────────────────────

  // Track expanded state per activity block: key = "renderer-scenario-segIdx"
  let expandedBlocks = $state<Record<string, boolean>>({});

  function toggleBlock(key: string) {
    expandedBlocks[key] = !expandedBlocks[key];
  }

  function isExpanded(key: string): boolean {
    return !!expandedBlocks[key];
  }

  // ─── Active renderer selection ───────────────────────────

  type RendererName = 'A' | 'B' | 'C';
  let activeRenderer = $state<RendererName>('A');

  const rendererMeta: Record<RendererName, { name: string; description: string }> = {
    A: {
      name: 'Compact Stack',
      description:
        'Activity blocks as tight pill stacks. Last 3 entries visible when collapsed. Claude Code inspired.'
    },
    B: {
      name: 'Inline Timeline',
      description: 'Vertical line with dots per entry. Entries flow inline between text segments.'
    },
    C: {
      name: 'Pill Collapse',
      description:
        'Single rounded pill per activity block. Shows latest entry only when collapsed, expands to full list.'
    }
  };
</script>

<svelte:head>
  <title>Renderer Prototypes</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-6 py-10 font-sans">
  <h1 class="mb-1 text-lg font-semibold text-foreground">AI Chat Renderer Prototypes</h1>
  <p class="mb-8 text-sm text-muted-foreground">
    Compare renderer styles across Gemini-style and Claude-style message patterns.
  </p>

  <!-- Renderer selector tabs -->
  <div class="mb-8 flex gap-1 rounded-lg bg-muted p-1">
    {#each ['A', 'B', 'C'] as const as id}
      <button
        onclick={() => (activeRenderer = id)}
        class="flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors
               {activeRenderer === id
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'}"
      >
        {rendererMeta[id].name}
      </button>
    {/each}
  </div>

  <p class="mb-6 text-xs text-muted-foreground">{rendererMeta[activeRenderer].description}</p>

  <!-- Scenarios grid -->
  <div class="grid gap-8">
    {#each scenarios as scenario, sIdx}
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <span class="text-xs font-medium text-foreground">{scenario.label}</span>
          {#if scenario.streaming}
            <span
              class="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-600 dark:text-blue-400"
            >
              <LoaderCircleIcon class="size-2.5 animate-spin" />
              streaming
            </span>
          {/if}
        </div>

        <!-- Message content area (simulating chat bubble) -->
        <div class="space-y-0">
          {#each scenario.segments as segment, segIdx}
            {#if segment.type === 'text'}
              <!-- ─── Text segment ─── -->
              <div class="py-1.5 text-xs leading-relaxed text-foreground">
                <!-- Simple markdown-ish rendering -->
                {@html segment.text
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(
                    /`(.*?)`/g,
                    '<code class="rounded bg-muted px-1 py-0.5 text-[11px]">$1</code>'
                  )
                  .replace(/\n- /g, '<br/>• ')
                  .replace(/\n\n/g, '<br/><br/>')
                  .replace(/\n/g, '<br/>')}
              </div>
            {:else if segment.type === 'activity'}
              <!-- ─── Activity segment (reasoning + tools) ─── -->
              {@const blockKey = `${activeRenderer}-${sIdx}-${segIdx}`}
              {@const expanded = isExpanded(blockKey)}
              {@const entries = segment.entries}
              {@const lastEntry = entries[entries.length - 1]}
              {@const isRunning =
                scenario.streaming && lastEntry?.kind === 'tool' && lastEntry.status === 'running'}
              {@const visibleWhenCollapsed = entries.slice(-3)}

              {#if activeRenderer === 'A'}
                <!-- ══════ RENDERER A: Compact Stack ══════ -->
                {@const filteredEntries = entries.filter(
                  (e) => !(e.kind === 'tool' && e.toolName === 'editYaml' && e.status === 'error')
                )}
                <div class="my-1">
                  <button
                    onclick={() => toggleBlock(blockKey)}
                    class="group flex w-full items-start gap-1.5 py-0.5 text-left opacity-60 transition-opacity hover:opacity-80"
                  >
                    <ChevronRightIcon
                      class="mt-[3px] size-2.5 shrink-0 text-muted-foreground/50 transition-transform {expanded
                        ? 'rotate-90'
                        : ''}"
                    />
                    <div class="min-w-0 flex-1">
                      {#if expanded}
                        <!-- Expanded: scrollable full entry list + inline reasoning -->
                        <div class="max-h-48 space-y-0.5 overflow-y-auto">
                          {#each filteredEntries as entry, eIdx}
                            {@const isLast = eIdx === filteredEntries.length - 1}
                            {#if entry.kind === 'tool'}
                              {@const Icon = TOOL_ICONS[entry.toolName] ?? BrainIcon}
                              <div class="flex items-center gap-1.5">
                                <Icon
                                  class="size-3 shrink-0 {isLast && isRunning
                                    ? 'text-blue-500'
                                    : entry.status === 'error'
                                      ? 'text-red-400'
                                      : 'text-muted-foreground/60'}"
                                />
                                <span class="truncate text-[11px] text-muted-foreground">
                                  {TOOL_LABELS[entry.toolName] ?? entry.toolName}
                                </span>
                                {#if entry.detail}
                                  <span class="truncate text-[11px] text-muted-foreground/50"
                                    >{entry.detail}</span
                                  >
                                {/if}
                                {#if entry.status === 'error'}
                                  <XIcon class="size-2.5 text-red-400" />
                                {:else if entry.status === 'done'}
                                  <CheckIcon class="size-2.5 text-emerald-500/60" />
                                {:else if entry.status === 'running'}
                                  <LoaderCircleIcon class="size-2.5 animate-spin text-blue-500" />
                                {/if}
                              </div>
                            {:else}
                              <div class="flex items-center gap-1.5">
                                <BrainIcon class="size-3 shrink-0 text-muted-foreground/60" />
                                <span class="truncate text-[11px] text-muted-foreground"
                                  >{entry.title}</span
                                >
                              </div>
                              <div
                                class="pt-0.5 pb-1 pl-[18px] text-[11px] leading-relaxed text-muted-foreground/70"
                              >
                                {entry.content}
                              </div>
                            {/if}
                          {/each}
                        </div>
                      {:else}
                        <!-- Collapsed: latest entry only -->
                        {@const lastEntry = filteredEntries[filteredEntries.length - 1]}
                        {#if lastEntry}
                          <div class="flex items-center gap-1.5">
                            {#if lastEntry.kind === 'tool'}
                              {@const Icon = TOOL_ICONS[lastEntry.toolName] ?? BrainIcon}
                              <Icon class="size-3 shrink-0 text-muted-foreground/50" />
                              <span class="truncate text-[11px] text-muted-foreground/70">
                                {TOOL_LABELS[lastEntry.toolName] ?? lastEntry.toolName}
                              </span>
                              {#if lastEntry.status === 'running'}
                                <LoaderCircleIcon class="size-2.5 animate-spin text-blue-500" />
                              {/if}
                            {:else}
                              <BrainIcon class="size-3 shrink-0 text-muted-foreground/50" />
                              <span class="truncate text-[11px] text-muted-foreground/70">
                                {lastEntry.title}
                              </span>
                            {/if}
                          </div>
                        {/if}
                      {/if}
                    </div>
                  </button>
                </div>
              {:else if activeRenderer === 'B'}
                <!-- ══════ RENDERER B: Inline Timeline ══════ -->
                <div class="my-2 ml-0.5">
                  <button onclick={() => toggleBlock(blockKey)} class="group flex w-full text-left">
                    <!-- Timeline rail -->
                    <div class="relative mr-2.5 flex w-3 shrink-0 flex-col items-center">
                      {#each entries as entry, eIdx}
                        {@const isLast = eIdx === entries.length - 1}
                        <!-- Dot -->
                        <div class="relative z-10 my-[3px]">
                          {#if entry.kind === 'tool' && entry.status === 'running'}
                            <div
                              class="size-2 rounded-full bg-blue-500 ring-2 ring-blue-500/20"
                            ></div>
                          {:else if entry.kind === 'tool' && entry.status === 'error'}
                            <div class="size-2 rounded-full bg-red-400"></div>
                          {:else}
                            <div
                              class="size-1.5 rounded-full {isLast
                                ? 'bg-muted-foreground/50'
                                : 'bg-muted-foreground/25'}"
                            ></div>
                          {/if}
                        </div>
                        <!-- Connector line (not after last) -->
                        {#if !isLast}
                          <div class="h-2.5 w-px bg-border"></div>
                        {/if}
                      {/each}
                    </div>

                    <!-- Entry labels -->
                    <div class="min-w-0 flex-1">
                      {#if expanded}
                        <div class="space-y-[5px]">
                          {#each entries as entry}
                            <div
                              class="flex items-center gap-1.5 leading-none"
                              style="height: 14px;"
                            >
                              {#if entry.kind === 'tool'}
                                {@const Icon = TOOL_ICONS[entry.toolName] ?? BrainIcon}
                                <Icon class="size-3 shrink-0 text-muted-foreground/60" />
                                <span class="text-[11px] text-muted-foreground/80"
                                  >{TOOL_LABELS[entry.toolName] ?? entry.toolName}</span
                                >
                                {#if entry.detail}
                                  <span class="text-[11px] text-muted-foreground/40"
                                    >· {entry.detail}</span
                                  >
                                {/if}
                                {#if entry.status === 'running'}
                                  <LoaderCircleIcon class="size-2.5 animate-spin text-blue-500" />
                                {/if}
                              {:else}
                                <BrainIcon class="size-3 shrink-0 text-muted-foreground/60" />
                                <span class="text-[11px] text-muted-foreground/80"
                                  >{entry.title}</span
                                >
                              {/if}
                            </div>
                          {/each}
                        </div>
                      {:else}
                        <!-- Collapsed: last 3 -->
                        <div class="space-y-[5px]">
                          {#each visibleWhenCollapsed as entry, eIdx}
                            {@const isLast = eIdx === visibleWhenCollapsed.length - 1}
                            <div
                              class="flex items-center gap-1.5 leading-none"
                              style="height: 14px;"
                            >
                              {#if entry.kind === 'tool'}
                                {@const Icon = TOOL_ICONS[entry.toolName] ?? BrainIcon}
                                <Icon
                                  class="size-3 shrink-0 {isLast
                                    ? 'text-muted-foreground/60'
                                    : 'text-muted-foreground/30'}"
                                />
                                <span
                                  class="text-[11px] {isLast
                                    ? 'text-muted-foreground/80'
                                    : 'text-muted-foreground/40'}"
                                >
                                  {TOOL_LABELS[entry.toolName] ?? entry.toolName}
                                </span>
                                {#if isLast && entry.status === 'running'}
                                  <LoaderCircleIcon class="size-2.5 animate-spin text-blue-500" />
                                {/if}
                              {:else}
                                <BrainIcon
                                  class="size-3 shrink-0 {isLast
                                    ? 'text-muted-foreground/60'
                                    : 'text-muted-foreground/30'}"
                                />
                                <span
                                  class="text-[11px] {isLast
                                    ? 'text-muted-foreground/80'
                                    : 'text-muted-foreground/40'}">{entry.title}</span
                                >
                              {/if}
                            </div>
                          {/each}
                          {#if entries.length > 3}
                            <div
                              class="text-[10px] leading-none text-muted-foreground/40"
                              style="height: 14px; display: flex; align-items: center;"
                            >
                              +{entries.length - 3} more
                            </div>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  </button>

                  {#if expanded}
                    {#each entries as entry}
                      {#if entry.kind === 'reasoning'}
                        <div
                          class="mt-1.5 ml-5 rounded border border-border/50 bg-muted/30 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground/70"
                        >
                          <span
                            class="mb-0.5 block text-[10px] font-medium text-muted-foreground/50"
                            >{entry.title}</span
                          >
                          {entry.content}
                        </div>
                      {/if}
                    {/each}
                  {/if}
                </div>
              {:else if activeRenderer === 'C'}
                <!-- ══════ RENDERER C: Pill Collapse ══════ -->
                <div class="my-1.5">
                  <button onclick={() => toggleBlock(blockKey)} class="group w-full text-left">
                    {#if expanded}
                      <!-- Expanded: full list in a rounded container -->
                      <div class="rounded-lg border border-border/50 bg-muted/20 px-2.5 py-2">
                        <div class="mb-1 flex items-center gap-1">
                          <ChevronDownIcon class="size-3 text-muted-foreground/40" />
                          <span class="text-[10px] font-medium text-muted-foreground/50">
                            {entries.length} steps
                          </span>
                        </div>
                        <div class="space-y-1">
                          {#each entries as entry}
                            <div class="flex items-center gap-1.5">
                              {#if entry.kind === 'tool'}
                                {@const Icon = TOOL_ICONS[entry.toolName] ?? BrainIcon}
                                <Icon
                                  class="size-3 shrink-0 {entry.status === 'error'
                                    ? 'text-red-400'
                                    : 'text-muted-foreground/60'}"
                                />
                                <span class="text-[11px] text-muted-foreground/80"
                                  >{TOOL_LABELS[entry.toolName] ?? entry.toolName}</span
                                >
                                {#if entry.detail}
                                  <span class="text-[11px] text-muted-foreground/40"
                                    >· {entry.detail}</span
                                  >
                                {/if}
                                {#if entry.status === 'error'}
                                  <XIcon class="size-2.5 text-red-400" />
                                {:else if entry.status === 'done'}
                                  <CheckIcon class="size-2.5 text-emerald-500/50" />
                                {:else if entry.status === 'running'}
                                  <LoaderCircleIcon class="size-2.5 animate-spin text-blue-500" />
                                {/if}
                              {:else}
                                <BrainIcon class="size-3 shrink-0 text-muted-foreground/60" />
                                <span class="text-[11px] text-muted-foreground/80"
                                  >{entry.title}</span
                                >
                              {/if}
                            </div>
                          {/each}
                        </div>
                      </div>
                    {:else}
                      <!-- Collapsed: single pill showing last 3 -->
                      <div
                        class="inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-2.5 py-1 transition-colors hover:bg-muted/50"
                      >
                        {#each visibleWhenCollapsed as entry, eIdx}
                          {@const isLast = eIdx === visibleWhenCollapsed.length - 1}
                          <div class="flex items-center gap-1">
                            {#if entry.kind === 'tool'}
                              {@const Icon = TOOL_ICONS[entry.toolName] ?? BrainIcon}
                              <Icon
                                class="size-3 {isLast
                                  ? 'text-muted-foreground/70'
                                  : 'text-muted-foreground/30'}"
                              />
                              {#if isLast}
                                <span class="text-[11px] text-muted-foreground/70">
                                  {TOOL_LABELS[entry.toolName] ?? entry.toolName}
                                </span>
                                {#if entry.status === 'running'}
                                  <LoaderCircleIcon class="size-2.5 animate-spin text-blue-500" />
                                {/if}
                              {/if}
                            {:else}
                              <BrainIcon
                                class="size-3 {isLast
                                  ? 'text-muted-foreground/70'
                                  : 'text-muted-foreground/30'}"
                              />
                              {#if isLast}
                                <span class="text-[11px] text-muted-foreground/70"
                                  >{entry.title}</span
                                >
                              {/if}
                            {/if}
                          </div>
                          {#if !isLast}
                            <div class="h-2.5 w-px bg-border/50"></div>
                          {/if}
                        {/each}
                        {#if entries.length > 3}
                          <span class="text-[10px] text-muted-foreground/30"
                            >+{entries.length - 3}</span
                          >
                        {/if}
                        <ChevronRightIcon class="size-2.5 text-muted-foreground/30" />
                      </div>
                    {/if}
                  </button>

                  {#if expanded}
                    {#each entries as entry}
                      {#if entry.kind === 'reasoning'}
                        <div
                          class="mt-1.5 ml-1 rounded border border-border/50 bg-muted/30 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground/70"
                        >
                          <span
                            class="mb-0.5 block text-[10px] font-medium text-muted-foreground/50"
                            >{entry.title}</span
                          >
                          {entry.content}
                        </div>
                      {/if}
                    {/each}
                  {/if}
                </div>
              {/if}
            {/if}
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <!-- Architecture notes -->
  <div class="mt-10 rounded-lg border border-border bg-muted/20 p-4">
    <h2 class="mb-2 text-xs font-semibold text-foreground">Architecture Notes</h2>
    <div class="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground/80">
      <p>
        <strong>Segment model:</strong>
        <code class="rounded bg-muted px-1">segmentize(UIMessage)</code>
        transforms parts[] into ordered
        <code class="rounded bg-muted px-1">TextSegment | ActivitySegment</code>. Consecutive
        reasoning + tool parts merge into one ActivitySegment.
      </p>
      <p>
        <strong>Entries:</strong> Each ActivitySegment has entries[] — either
        <code class="rounded bg-muted px-1">ReasoningEntry</code>
        (with parsed title + content) or <code class="rounded bg-muted px-1">ToolEntry</code> (with icon
        from registry). Reasoning titles parsed from first sentence/line of thinking content.
      </p>
      <p>
        <strong>Collapsed state:</strong> Shows last 3 entries. Expanded state shows all entries + reasoning
        content blocks.
      </p>
      <p>
        <strong>Tool icons:</strong> Registered in
        <code class="rounded bg-muted px-1">TOOL_ICONS</code> — each tool maps to a Lucide icon component.
        New tools just add an entry.
      </p>
      <p>
        <strong>Renderer swap:</strong> One reactive binding selects the active renderer. Can be driven
        by PostHog feature flags, user preference, or dev toggle.
      </p>
    </div>
  </div>
</div>
