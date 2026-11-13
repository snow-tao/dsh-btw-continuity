# DSH BTW Continuity

Continuous side questions in DeepSeek Harness: one chronological panel per session, inline follow-ups, and no interruption to the main task.

[简体中文](README.zh-CN.md) · English · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

> **BTW Continuity is an independent modification of [MichengAI DSH BTW 1.3.10](https://github.com/MichengAI/dsh-btw)**, licensed under Apache-2.0 and endorsed by neither DeepSeek AI nor MichengAI. See [NOTICE.md](NOTICE.md) for attribution and modifications.

## Features

- **Continuous conversation per session**: every BTW turn appears in one chronological panel.
- **Inline follow-ups**: ask from the expanded panel's bottom composer. Enter sends; Shift+Enter inserts a newline.
- **Adaptive composer**: starts at one line, grows up to four lines, then scrolls internally and returns to one line after sending.
- **Hide and restore**: X only hides the panel; the next question restores its visible history.
- **Explicit reset**: the trash icon clears the current session's BTW history and starts over.
- **Main-task isolation**: answers stay out of the main conversation by default. `send_message` is used only when explicitly requested.
- **Read-only answers**: no new file reads, web access, commands, or edits by default; optional tool allowlisting remains restricted.
- **Selection questions and i18n**: ask about selected text, render Markdown and formulas, copy answers, and use eight interface languages.

## Current interface

![BTW Continuity single-panel conversation with history and an inline follow-up composer](assets/screenshots/btw-continuity-panel.webp)

## Prerequisites

- DeepSeek Harness `>=0.2.0-rc.1 <0.3.0-0`
- Node.js 22+
- A configured model provider

**This package is a modification of `@michengai/dsh-btw`. Both register `/btw`, so they cannot be enabled together.**

## Installation

Replace `desktop` with your actual profile:

```bash
dsh plugin --profile desktop add dsh-btw-continuity@latest --registry=https://registry.npmjs.org/
```

If it does not activate automatically, reload the desktop app or restart the corresponding DSH service. Refreshing the browser alone may not reload new Host code.

## Usage

### Start or append a side question

```text
/btw Summarize the current proposal in one sentence
```

You can also select `btw` from the `/` menu or use **Ask BTW** on selected message text.

### Follow up inside the panel

Expand the BTW panel and use its dedicated bottom composer:

- **Enter**: send;
- **Shift+Enter**: insert a newline;
- the composer starts at one line and grows up to four lines;
- inline follow-ups and `/btw` share the same session history.

### Hide, restore, and clear

| Action | Behavior |
| --- | --- |
| X | Hides the entire panel without clearing history; the next question restores it. |
| Trash icon | Clears all BTW history for this session and removes the panel; the next question starts fresh. |
| Copy | Copies the corresponding answer's original Markdown. |

### History and privacy

- Later requests include earlier completed BTW turns and the main-session context at ask time, which may increase token usage.
- Requests still go only to the configured model provider; no additional third-party recipient is introduced.
- BTW history is held in Host memory and is lost when the Host restarts. Copy answers you need to keep permanently.
- Visible history can be restored from the Host after a page refresh. An answer still being generated is not part of completed history.

## Settings

Open **Plugins → BTW Continuity → Configure**:

| Field | Effect |
| --- | --- |
| Allowed tools | Tool names allowed in addition to `send_message`, one per line. Text-only by default. |
| Custom prompt | Replaces the built-in side-question prompt; tool-permission instructions are still appended. |

## Uninstallation

```bash
dsh plugin --profile desktop remove dsh-btw-continuity
```

## Development

```bash
npm ci --ignore-scripts
npm run check
```

`npm run check` performs type checking, tests, release checks, and the build. The development and build baseline is DSH `0.2.2-rc.2`.

## License

[Apache-2.0](LICENSE) · [Attribution and modifications](NOTICE.md)
