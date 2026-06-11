---
title: Keyboard Shortcuts
description: Fast workspace actions for editing, file management, and preview control.
---

Keyboard shortcuts are active only when they will not interfere with text editing. The app skips global undo/redo shortcuts when focus is inside an input, textarea, contenteditable element, menu, dialog, or Monaco editor.

## Editing

- `Cmd/Ctrl+Z`: undo the last app-level file change.
- `Cmd+Shift+Z`: redo.
- `Ctrl+Y`: redo on non-Mac keyboard paths.

Monaco keeps its own editor-native undo stack while focused.

## File Management

- `Cmd/Ctrl+K`: lock or unlock the selected file.
- `Cmd/Ctrl+D`: duplicate the selected file.
- `Cmd/Ctrl+Backspace`: move the selected file to trash.

The sidebar file menu also shows shortcut hints for lock, duplicate, and trash actions.

## Preview

Preview zoom supports toolbar buttons and pointer gestures. Trackpad pinch and modifier-wheel gestures adjust zoom without changing exported PDF size.
