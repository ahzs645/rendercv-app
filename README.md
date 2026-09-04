# RenderCV Agent Studio

RenderCV Agent Studio is a browser-based résumé workspace where a person and an AI agent can work on the same document together. The person edits structured forms or YAML and watches a live PDF preview. A browser agent uses WebMCP tools to inspect the same active résumé, make precise edits, create role-specific variants, and undo changes without scraping the interface.

**Live app:** [projects.ahmadjalil.com/rendercv-app](https://projects.ahmadjalil.com/rendercv-app/)

## Why WebMCP

Résumé tailoring is a collaborative task, not a one-shot generation task. The person owns the facts, tone, and final judgment; the agent is good at analyzing structure, comparing role requirements, and applying repetitive edits. Without WebMCP, an agent has to infer a complex editor from screenshots and simulated clicks. With WebMCP, it gets a small, typed interface over the app's real client-side state.

The result is a shared visual loop:

1. The person opens the résumé they want to work on.
2. The agent calls `inspect_active_resume` to understand the exact document and revision.
3. The person asks for a change or a tailored version.
4. The agent applies targeted edits or creates a non-destructive variant.
5. RenderCV updates the editor and PDF preview immediately and shows the action to the person.
6. The person can refine the result manually or ask the agent to undo it.

The active browser tab supplies identity, document state, local persistence, and visual context. No separate MCP server, duplicated authentication layer, or hidden agent-side copy is required.

## WebMCP tools

The workspace registers tools through `document.modelContext.registerTool()` only while an editable résumé is active.

```ts
await document.modelContext.registerTool({
  name: 'inspect_active_resume',
  description: 'Read the active RenderCV resume before proposing edits or tailoring it.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  execute: () => inspectActiveResume()
});
```

The production implementation uses the same API with lifecycle cleanup and the app's live store.

| Tool | Purpose |
| --- | --- |
| `inspect_active_resume` | Returns profile fields, entries, stable fingerprints, variants, theme, and the current revision. |
| `patch_active_resume` | Applies targeted JSON Pointer edits inside `/cv` and refreshes the editor and preview. |
| `replace_resume_yaml_section` | Replaces a complete CV, design, locale, or settings YAML section. |
| `create_tailored_resume_variant` | Creates a non-destructive variant by excluding sections or fingerprinted entries. |
| `activate_resume_variant` | Switches the visible preview to an existing tailored variant. |
| `undo_last_resume_change` | Reverts the most recent workspace change. |

Write tools use the same `fileStore` actions as the human interface, so persistence, undo history, and rendering stay in sync. `patch_active_resume` also requires the revision returned by the inspection tool; if the person edits the résumé in the meantime, the agent receives a conflict instead of overwriting newer work.

The implementation lives in [`apps/web/src/features/webmcp/resume-tools.ts`](apps/web/src/features/webmcp/resume-tools.ts).

## Run locally

Prerequisites: Node.js 22 and pnpm 10.

```bash
pnpm install
pnpm dev:web
```

Vite prints the local URL. RenderCV still works in browsers without WebMCP; only the agent tools are omitted.

To test the tools:

- Open the deployed HTTPS app in ChatGPT's in-app browser; or
- Enable `chrome://flags/#enable-webmcp-testing` in a compatible Chrome build, relaunch Chrome, and open the app.

Open a résumé, then ask the browser agent something like:

> Inspect this résumé. Change the headline to “Staff Machine Learning Engineer,” strengthen the first experience bullet without inventing facts, and create a “Platform role” variant that keeps experience, projects, and skills prominent.

## Verify

```bash
pnpm typecheck
pnpm test
pnpm build
```

The web package includes unit tests for targeted patching, nested array edits, immutable updates, path restrictions, and prototype-pollution protection.

## Project structure

- `apps/web`: React/Vite editor, live preview, WebMCP integration, and browser workers.
- `apps/api`: optional API routes for hosted features.
- `packages/core`: résumé stores, undo history, variants, templates, and shared logic.
- `packages/contracts`: shared TypeScript contracts.
- `themes` and `static`: RenderCV themes, fonts, and browser runtime assets.
- `docs`: user and developer documentation.

## Safety and privacy

- Résumé contents are returned only through a read-only tool in the active browser page.
- All content writes stay inside the selected résumé's `/cv` object or a named RenderCV YAML section.
- Unsafe JSON Pointer segments are rejected.
- Stale writes are rejected using the résumé revision.
- Read-only or locked résumés cannot be modified by tools.
- Agent changes enter the normal undo history and remain visible in the editor and preview.
- WebMCP registration is feature-detected and cleaned up with `AbortController` when the workspace unmounts.

## License

This project is available under the [MIT License](LICENSE).
