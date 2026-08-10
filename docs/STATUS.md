# Status & handoff

_Last updated: 2026-08-10 (built the working PWA prototype)._

## Where things stand

Economy is settled and now there is a **working PWA prototype**, wired to
`src/economy.js` and verified end-to-end in the browser (grind ×3, hard-block on
broke, cleaning cap, exceptional-with-reason, munchies floor, 7-day vacation
guard, localStorage persistence, idempotent daily catch-up). Files:

- `docs/SPEC.md` — economy rules (authority).
- `src/economy.js` — pure JS implementation of the rules (source of truth).
- `src/app.js` — UI logic, state, localStorage, auto-credit, vacation scheduler.
- `index.html`, `styles.css` — home screen (mobile-first, dark).
- `manifest.webmanifest`, `sw.js`, `icon.svg` — PWA install + offline.
- `README.md` — run instructions (`python -m http.server`, then localhost).
- `CLAUDE.md` — project guide.

**Initial commit made** on branch `main` (`9737761`). Not yet pushed to a remote
— Angel will create a public GitHub repo and enable Pages (steps in `README.md`)
to install it on the phone over HTTPS.

### Resolved this session
- **Broke behavior → hard block** (won't log an unaffordable smoke).
- **Daily/Friday crediting → auto on open, catch up missed days** (idempotent).

### Known gaps / polish
- PWA icons are SVG-only (no PNG rasterizer installed). Add `icon-192/512.png`
  later if Android install wants them.
- To install on the phone it must be served over http(s) somewhere (local server
  or a static host). Not yet decided how Angel will host/run it on the phone.

## Decisions made

- Concept: point economy (**"Smoke Coins"**) to moderate weed use. Earn +1/day,
  **+1/workout (max 1/day, 5/week)**, **+1/cleaning (max 1/day, 2/week)**, +5 every
  Friday. Spend on smokes: one-hitter 1 / pipe 2 / bong (shown "Bong / Joint") 3.
- **Munchies penalty**: −1 each time (overeating), **max 1/day**. Not multiplied;
  floors at 0 (can zero a balance but not go negative).
- **UI (this session)**: purple theme (Flumph-ish violet, but code stays fully
  independent). ☰ menu opens **History** (full log filtered by month, with a net
  summary) and **Vacation & holidays** (interactive month **calendar** highlighting
  weekends / days off / today; tap a day ≥7 days out to mark it off **with an
  optional reason**, tap again to remove). Home screen "Recent" shows 5 rows.
- Multiplier stacks: start at 1, **+1 on a "grind day"** — a work day whose *next*
  day is also a work day, so Friday and the eve of any time off count as weekend
  (revised this session from the old plain "work day" rule) — **+1 if before 6pm**
  (any day — makes wake-and-bake expensive). Range 1–3. Final cost = base ×
  multiplier.
- Open intent: Angel may add more earning sources later, and rules may need
  future adjustment. Current set is accepted as the starting point.
- **No debt** (can't spend below 0). Points **bank forever** (no cap/decay).
- **Exceptionals**: 2/month, each a *free pipe*, allowed even at 0 balance,
  **written reason mandatory**. Don't roll over.
- Vacation/holiday days: convert a Mon–Fri into a non-work day; must be scheduled
  **≥7 days in advance** (guard rail against last-minute self-justification).
- Every earn/spend is logged with an optional note (mandatory note on exceptionals).
- Tech: local-only buildless PWA, localStorage. (See CLAUDE.md.)

## Modeling insight (from the simulator)

- The **multiplier is the dominant lever** — the same amount of smoking is
  net-positive at ×1 (weekend evenings) but net-negative at ×2/×3. The system
  nudges toward better *timing* rather than just capping totals.
- **Validated this session** (Python mirror of `economy.js`, steady-state month,
  3 workouts + 2 cleanings/wk, earn ≈ 73 pts/month):
  - Weekend-evenings only → **+45/mo** (banks fast).
  - One-hitter *every* evening, after 6pm → **+25/mo** (still sustainable).
  - Daytime + weekend-afternoon mix → **−17/mo** (goes underwater — hits no-debt).
  - Munchies at 2/wk ≈ −8/mo: visible but small vs the ±40 multiplier swings, i.e.
    a tracker, not a real deterrent (as intended).
- No-debt only bites at startup (thin balance blocks early sessions); a non-issue
  once a cushion is banked.
- Unlimited banking could fund an occasional binge after a good streak. Accepted
  for now (it's *earned*). If it ever enables regretted weekends, the knob to add
  is a **soft weekly spend cap** — not built yet.
- Scratch simulator lives in the session scratchpad (`sim.py`), not committed.
  An interactive HTML playground widget was also built this session to explore
  costs/balance live (embeds its own copy of the rules; `economy.js` stays the
  source of truth).

## Open questions (undecided — ask me before assuming)

1. **Broke behavior** when spending with 0 points and no exceptionals left:
   hard block (won't log) vs. warn-but-allow (logs, flags "over budget",
   balance stays 0). Leaning hard block, not confirmed.
2. **Crediting daily/Friday points**: auto-credit missed days on app open vs. a
   manual "claim" button. Leaning auto-on-open, not confirmed.
3. **First build**: working PWA prototype vs. more number-tuning vs. a fuller
   design doc first. Not chosen.
4. **Sunday-evening ×1**: because the grind test needs *today* to be a work day,
   Sunday night is cheap even though Monday is work. Left literal this session per
   Angel's wording; flag to flip to a "tomorrow is a work day" rule if it bugs.

## Suggested next steps

- Use it for a real week and see how the numbers feel (base costs still untuned
  against real data).
- Decide how to run/host it on the phone (local server vs static host) and
  whether PNG icons are needed for install.
- Possible features: edit/delete log entries, backup/export the log as JSON,
  trend chart + streaks, more earning sources (Angel expects to add some).
- Commit when ready (nothing committed yet).
