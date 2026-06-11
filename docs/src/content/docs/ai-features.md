---
title: AI Features
description: Document the feature-flagged AI editor, chat providers, proposals, usage limits, and BYOK behavior.
---

AI features exist in the codebase but are disabled by default:

- `ENABLE_AI_EDITOR = false`
- `ENABLE_ENHANCED_AI_CHAT = false`

When disabled, the workspace AI editor trigger is hidden and the onboarding tour skips the AI Assistant step.

## Basic AI Panel

When enabled, the basic AI panel can provide resume-aware guidance for:

- Bullet rewrites.
- Headline improvements.
- Experience section improvements.
- Cover letter generation.

Chat messages are stored on the active CV file.

## Enhanced AI Panel

The enhanced panel supports richer context and proposal workflows:

- Up to 4 file attachments.
- Up to 4 selected CV context snippets.
- Markdown assistant rendering.
- Activity and data parts.
- YAML edit proposals with Apply and Reject actions.

## Providers

The app supports:

- Managed provider.
- OpenAI bring-your-own-key.
- Anthropic bring-your-own-key.

Bring-your-own keys are stored in browser preferences and sent with each chat request. The server forwards the prompt plus up to 8,000 characters of current CV YAML to the selected provider.

## Usage

Managed AI usage is tracked server-side through `serverState.aiUsage`. Quota exhaustion returns `402 quota_exceeded`.

The current managed route returns deterministic local guidance rather than calling a hosted model.

## Cover Letters

Cover letter prompts can produce a generated Typst document card. The document can be downloaded from the AI response.
