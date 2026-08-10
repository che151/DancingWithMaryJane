# Dance With Mary Jane

A personal, local-only app to moderate weed consumption with a **Smoke Coin**
economy. Earn coins for good habits (showing up daily, working out, cleaning),
spend them to "buy" a smoke, with multipliers that make work days and daytime
use cost more.

Single user, no accounts, no backend. A buildless PWA (open in the phone browser,
install to home screen, data in `localStorage`).

## Run it

Needs to be served over http (ES modules + service worker don't work from
`file://`). Node isn't required — use Python:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000/>. (This local URL is only for testing on the
same machine — to install on a phone see below.)

## Install on your phone (GitHub Pages)

A phone can only install this as a real, offline app when it's served over
**HTTPS**. The simplest free way is GitHub Pages. Your log stays on the phone
(`localStorage`) — only the static HTML/JS is hosted, no data leaves the device.

1. Create a new repository on <https://github.com> (public is fine; it holds no
   personal data).
2. Push this project to it:
   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a
   branch → Branch: `main` / `/root` → Save.**
4. Wait ~1 min, then open the given `https://<you>.github.io/<repo>/` URL in
   Chrome on the phone.
5. Chrome menu → **Install app** / **Add to home screen**. It now runs full-screen
   and works offline.

## Docs

- [docs/SPEC.md](docs/SPEC.md) — the economy rules (authority).
- [docs/STATUS.md](docs/STATUS.md) — current status, decisions, open questions.
- [CLAUDE.md](CLAUDE.md) — project guide / conventions.

## Files

- `index.html` — the app shell (home screen).
- `styles.css` — styling (mobile-first, dark).
- `src/economy.js` — pure economy rules (single source of truth).
- `src/app.js` — UI logic, state, `localStorage`, auto-credit, vacation scheduler.
- `manifest.webmanifest`, `sw.js`, `icon.svg` — PWA install + offline.

## The economy in one glance

- Earn: **+1**/day, **+1**/workout, **+1**/cleaning (max 2/wk), **+5** every Friday.
- Base cost: one-hitter **1**, pipe **2**, bong / joint **3**.
- Multiplier (stacks, 1–3): +1 on a grind day (work today *and* tomorrow),
  +1 before 6pm.
- Munchies: **−1** each (floors at 0).
- No debt (hard block). Coins bank forever. 2 "exceptional" free pipes/month
  (written reason required). Vacation days must be set ≥7 days ahead.
