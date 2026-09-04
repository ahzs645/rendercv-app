# WebMCP Challenge submission kit

## Project name

RenderCV Agent Studio

## Tagline

A shared résumé workspace where people keep visual control while agents inspect, tailor, and refine the live document through typed browser tools.

## Short description

RenderCV Agent Studio turns résumé editing into a human-agent collaboration. A person works in a structured editor or YAML and sees a live PDF preview. Through WebMCP, their browser agent can inspect the active résumé, make conflict-safe targeted edits, create non-destructive role variants, switch the preview, and undo changes. Both work on the same local state instead of passing document copies back and forth.

## Why this is a strong fit for WebMCP

Résumé work combines private structured data, subjective human judgment, iterative writing, and immediate visual layout feedback. It is poorly served by blind UI automation: the editor has nested entries, YAML, theme controls, variants, and a generated PDF preview. A screenshot-driven agent must repeatedly rediscover that interface and can easily change the wrong field.

WebMCP lets RenderCV expose the exact client-side operations an agent needs while preserving the human interface as the center of the experience. The agent reads the active document and its revision, applies a small set of typed operations, and the person immediately sees the result in the same editor and preview. Browser state, local persistence, undo history, and the selected résumé are reused directly; there is no separate agent backend or shadow document.

## How it creates a better user experience

The user can describe an outcome—such as tailoring a résumé for a platform engineering role—without manually hunting through every section. The agent analyzes the structured content and performs the mechanical work. The user remains responsible for facts and taste, sees each change immediately, can continue editing by hand, and can undo an agent action through either the normal toolbar or another tool call.

Targeted writes include optimistic concurrency. Every inspection returns `lastEdited`; a write with a stale revision is rejected if the person has changed the document since the agent looked. This makes simultaneous collaboration safer than copy-paste or a one-shot “generate my résumé” workflow.

## What people and agents can do together that was difficult before

- Review the exact active résumé without exporting or uploading a second copy.
- Apply precise nested edits while the person watches the live PDF reflow.
- Create multiple job-specific views without deleting or duplicating source content.
- Switch between tailored variants during a conversation and compare them visually.
- Mix agent changes and manual editing in one undoable history.
- Detect and stop stale agent writes when the human edits concurrently.

## How WebMCP was implemented

The React workspace feature-detects `document.modelContext` and registers six imperative tools with JSON Schemas. The tools call the same TypeScript store actions used by the human UI. Read operations serialize the active résumé into agent-friendly structured data, including stable entry fingerprints. Targeted writes use restricted JSON Pointer operations, validate the current revision, update the store, and trigger the existing editor, persistence, undo, and live rendering paths. Tailored variants store section and entry exclusions as metadata, leaving the original résumé untouched. An `AbortController` removes the tools when the workspace is no longer active.

## Links

- Live app: https://projects.ahmadjalil.com/rendercv-app/
- Repository: https://github.com/ahzs645/rendercv-app
- WebMCP implementation: `apps/web/src/features/webmcp/resume-tools.ts`

## Demo video script (about 2:30)

### 0:00–0:20 — Problem and product

Show the RenderCV editor and live PDF side by side.

> “Résumé tailoring is collaborative. I know what is true and what sounds like me; an agent is good at analysis and repetitive structured edits. RenderCV Agent Studio lets us work on the same live résumé instead of exchanging copies.”

### 0:20–0:40 — WebMCP discovery

Open ChatGPT's in-app browser agent and ask it to inspect the page. Briefly show the discovered tools.

> “The page registers six typed WebMCP tools directly in the browser. The agent can read the selected résumé, patch exact fields, create and activate variants, and undo changes.”

### 0:40–1:20 — Precise shared edit

Prompt:

> “Inspect this résumé. Change the headline to ‘Staff Machine Learning Engineer’ and tighten the first experience highlight. Preserve every number and do not invent facts.”

Show the agent calling `inspect_active_resume`, then `patch_active_resume`. Keep the editor and PDF visible as both update. Point out the toast.

> “The write is revision-checked, so it cannot silently overwrite a manual change made after inspection. It enters the same undo history as a human edit.”

### 1:20–2:00 — Non-destructive tailoring

Prompt:

> “Create a ‘Platform role’ variant. Keep experience, projects, and skills, and hide publications, patents, and invited talks.”

Show `create_tailored_resume_variant`, the variant selector changing, and the PDF shrinking while the original content remains in the editor.

> “This is not a generated second copy. The tool stores visibility metadata over the original résumé, so the person can keep editing one source of truth.”

### 2:00–2:20 — Human control

Ask the agent to undo, or click the normal undo button. Show the preview return.

> “The user stays in control: every action is visible, editable, and reversible from either side of the interface.”

### 2:20–2:35 — Close

Show the repository and the WebMCP registration file.

> “RenderCV Agent Studio uses WebMCP to make a complex browser workspace reliably usable by people and their agents together—without replacing the web app or adding a separate agent backend.”

## Submission checklist

- [ ] Register for the challenge and confirm eligibility under the official rules.
- [ ] Push the WebMCP branch to the public repository.
- [ ] Confirm the GitHub Pages deployment contains the new tools.
- [ ] In GitHub repository settings, select `LICENSE` for the repository license/About metadata if it is not detected automatically.
- [ ] Test the deployed HTTPS URL in ChatGPT's in-app browser.
- [ ] Test one edit, one variant creation, and one undo from a fresh session.
- [ ] Record a public YouTube video shorter than three minutes with audible narration.
- [ ] Paste the description sections above into Devpost.
- [ ] Add the live URL, repository URL, and YouTube URL to the submission.
- [ ] If the app needs no login, leave credentials blank.
- [ ] Submit before September 4, 2026 at 1:00 a.m. Pacific Time.

