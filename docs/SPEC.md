# Dance With Mary Jane — Economy Spec

A personal, local-only Smoke Coin economy to moderate weed consumption. Earn Smoke
Coins for healthy behavior, spend them to "buy" a smoke. Only-for-me tool: it can't
stop me lying to it, so the goal is an honest mirror, not a warden. Every earn and
every spend is logged with an optional note.

## Currency

**Smoke Coins** ("coins"). Integer. **Banked forever** (no cap, no decay). **No
debt**: you cannot spend below 0 — if you can't afford it, you can't buy it (see
Exceptionals for the escape valve).

## Earning

| Source        | Coins  | When                                             |
|---------------|--------|--------------------------------------------------|
| Daily         | +1     | Once per day (just for showing up)               |
| Workout       | +1     | Each logged workout, **max 1/day, 5/week**       |
| Cleaning      | +1     | Each logged cleaning, **max 1/day, 2/week**      |
| Danish        | +1     | Learning Danish, **max 1/day**                   |
| Groceries     | +1     | Grocery shopping, **max 1/day, 2/week**          |
| Friday bonus  | +5     | Every Friday (weekend fuel)                      |

Earning is never affected by work day / vacation status. A Friday that is a
vacation day still pays the +5.

### Penalties

| Source   | Coins  | When                                                  |
|----------|--------|-------------------------------------------------------|
| Munchies | −1     | Giving in to the munchies (overeating), **max 1/day** |

The munchies penalty is an honesty tracker, not a purchase: it is not subject to
the multiplier. It floors at 0 (it can zero out a balance but not push it
negative — consistent with the no-debt rule).

## Spending — base cost

| Action        | Base cost |
|---------------|-----------|
| One-hitter    | 1         |
| Pipe          | 3         |
| Bong / Joint  | 5         |
| XMax          | 1         |
| XQ2 small     | 3         |
| XQ2 large     | 5         |

## Spending — multiplier

The multiplier starts at **1** and each condition below **adds +1** (they stack):

- **+1 on a grind day** — a day that is a work day **and whose next day is also a
  work day**. This means Friday (Saturday is off) and the last work day before any
  vacation/holiday count as weekend, not grind. A day marked vacation/holiday is
  never a grind day.
- **+1 if before 6:00 PM** — regardless of the day (this makes wake-and-bake
  expensive everywhere).

So the multiplier ranges 1–3.

**Final cost = base cost × multiplier.**

### Full cost table

| Action \ Context | Non-grind, ≥6pm (×1) | Non-grind AM / Grind PM (×2) | Grind AM (×3) |
|------------------|----------------------|------------------------------|---------------|
| One-hitter       | 1                    | 2                            | 3             |
| Pipe             | 3                    | 6                            | 9             |
| Bong / Joint     | 5                    | 10                           | 15            |
| XMax             | 1                    | 2                            | 3             |
| XQ2 small        | 3                    | 6                            | 9             |
| XQ2 large        | 5                    | 10                           | 15            |

("AM" = before 6:00 PM, "PM" = 6:00 PM or later. "Grind" = work today **and**
tomorrow; "non-grind" = weekend, Friday, day off, or the eve of time off.)

Note: because the grind test requires *today* to be a work day, Sunday evening is
×1 even though Monday is a work day. If the goal becomes "the night before a work
day is pricier," the rule would instead key off *tomorrow* only.

## Exceptionals (escape valve)

- **2 per calendar month.**
- An exceptional is a **free pipe** — costs 0 coins and is allowed even at a 0
  balance (bypasses the no-debt rule).
- **A written reason is mandatory** to use one. No reason, no exceptional.
- Unused exceptionals do **not** roll over to the next month.

## Work days, vacation & holidays

- Work days are **Monday–Friday** by default.
- I can mark specific days as **vacation/holiday** (turns them into non-work days
  for the multiplier — removes the work-day +1).
- **A vacation/holiday day must be added at least 7 days in advance.** Cannot mark
  today, tomorrow, or anything inside the next week as off. (Guard rail against
  spur-of-the-moment self-justification.)

## Logging

Every action writes a log entry:

- timestamp
- type: `earn` (daily / workout / cleaning / danish / grocery / friday), `spend` (one-hitter / pipe /
  bong / xmax / xq2small / xq2large / exceptional), or `penalty` (munchies) — note
  the `bong` action is shown in the UI as "Bong / Joint"
- coin delta (signed)
- multiplier applied (for spends)
- balance after
- optional free-text note (mandatory for exceptionals)

## Open questions / possible later

- Trend chart + streaks (days under budget, longest gap between smokes).
- Editable/deletable log entries (honesty vs. tidy history).
- Backup/export of the log (single JSON file).
