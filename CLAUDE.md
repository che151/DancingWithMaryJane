# Dance With Mary Jane — guide for Claude Code

A personal, **local-only** app to help me (the sole user, Angel) moderate weed
consumption with a point economy: earn points for healthy behavior (showing up
each day, working out), spend them to "buy" a smoke, with multipliers that make
work days and daytime use more expensive. It's an honest mirror for one person,
not a multi-user product and not a warden — it can't stop me lying to it, so the
design goal is low-friction honest logging.

This project is **fully independent** from `D:\FlumphExistentiel` (a D&D app). No
shared code, git, or conventions. Ignore anything D&D-related.

## Get your bearings

- `docs/SPEC.md` — the **authority** on the economy rules (earning, costs,
  multiplier, exceptionals, vacation rules, logging). Read it first.
- `docs/STATUS.md` — living status: decisions made, open questions, next steps.
  Read at the start of a session, update when something changes.
- `src/economy.js` — pure JS implementation of the rules (single source of truth
  for the math). No I/O. The app UI should call into this, not re-derive costs.

## Tech direction (decided)

- **Local-only PWA**: plain HTML/CSS/JS, data in browser `localStorage`,
  installable to the phone home screen, works offline, no backend, no accounts,
  no Play Store. Chosen because it's a solo tool and this iterates in seconds.
- Kotlin/Compose native was considered and rejected as overkill for one user.
- **No build tooling required.** Keep it buildless if possible (open `index.html`
  directly). Economy logic stays in plain JS modules.

## Environment gotchas

- Windows 10. Project root: `D:\DanceWithMaryJane`.
- **Node is NOT installed.** Do not assume `npm`/`node`. Python 3.12 is available
  (`python` / `py`). Prefer no toolchain; if a runtime is needed for scripts, use
  Python.
- Git repo is initialized; **nothing committed yet**. Confirm with me before
  making commits.
- Primary shell is PowerShell; a Bash tool is also available.

## Conventions

- Everything in English (code, comments, docs).
- Keep it simple and dependency-free where reasonable. This is a personal tool;
  don't add frameworks, servers, or accounts.
- Round every number shown to the user (integer points).
