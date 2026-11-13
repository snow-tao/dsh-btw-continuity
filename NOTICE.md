# Attribution and modifications

DSH BTW Continuity is an independent, community-maintained modification of **DSH BTW 1.3.10**.

- Upstream project: https://github.com/MichengAI/dsh-btw
- Upstream author: MichengAI (https://github.com/MichengAI)
- Upstream copyright: Copyright 2026 MichengAI
- License: Apache License 2.0; see `LICENSE`.

This package is not an official DeepSeek AI product and is not endorsed by DeepSeek AI or MichengAI.

## Main modifications

- Added session-scoped BTW history and restoration.
- Added a single-panel chronological conversation UI.
- Added inline follow-ups with an auto-growing one-to-four-line composer.
- Added explicit history clearing and lifecycle isolation between sessions.
- Renamed the package, Loader row, locale namespace, settings binding, and UI slot to `dsh-btw-continuity`.

The original `/btw` command is retained for familiarity. Do not install or enable this package together with `@michengai/dsh-btw`, because both register the same public command.
