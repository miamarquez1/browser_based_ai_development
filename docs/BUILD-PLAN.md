# Streak Counter – Build Plan

This document records the incremental build plan we agreed on before coding began.
Each step is scoped to be reviewable and testable in **5–10 minutes**.

---

## Step 1 – Project Scaffolding

**Goal:** Get a styled, static shell in the browser with no logic yet.

Files to create:

- `browser_based_ai_development/index.html` – page structure: title, three stat cards (Current Streak / Longest Streak / Total Check-ins), status message, last-visit line
- `browser_based_ai_development/style.css` – visual design: card layout, orange brand palette, responsive flex grid

**How to review:** Open `index.html` in a browser. Should look like a finished UI with all values at their static defaults (`0` / `Never`). No JavaScript runs.

**Status:** ✅ Complete

---

## Step 2 – Streak Data Model

**Goal:** Create a persistence layer that stores and retrieves streak state from `localStorage`.

File to create:

- `browser_based_ai_development/streak.js`

What to implement:

- `defaultState()` – the shape of a fresh streak record
- `load()` – read and parse state from `localStorage`; fall back to default if missing or corrupt
- `save(state)` – write state to `localStorage`

**How to review:** Open the browser console and call `StreakCounter.load()`. Should return `{ currentStreak: 0, longestStreak: 0, totalCheckins: 0, lastCheckinDate: null, checkinDates: [] }`.

**Status:** ✅ Complete

---

## Step 3 – Streak Calculation Logic

**Goal:** Add the core rules for extending, resetting, and querying a streak.

Additions to `streak.js`:

- `daysBetween(dateA, dateB)` – returns the difference in whole calendar days (DST-safe)
- `recalculateStreak(state)` – resets `currentStreak` to `0` if more than one day has passed since the last visit
- `checkIn()` – records today's visit; extends or restarts the streak; updates `longestStreak`; returns `{ state, alreadyCheckedIn }`
- `getState()` – loads state and recalculates the streak before returning it
- `reset()` – clears all data (useful for testing)

**Key rules:**

- Visiting on consecutive days increments the streak
- Missing a day resets `currentStreak` to `0` (but preserves `longestStreak`)
- Visiting multiple times on the same day is a no-op

**How to review:** Open the console and call `StreakCounter.checkIn()` twice. Second call should return `alreadyCheckedIn: true` and the streak should stay at `1`.

**Status:** ⬜ Pending

---

## Step 4 – UI Rendering

**Goal:** Wire the data model to the DOM so stats display correctly on page load.

File to create:

- `browser_based_ai_development/app.js`

What to implement:

- `formatDate(isoDate)` – converts `YYYY-MM-DD` to a readable string (e.g. "February 23, 2026")
- `renderState(state, animate)` – updates the three stat values and last-visit date in the DOM
- `animatePop(el)` – plays a brief scale animation on a stat element when it updates
- `initializeUI()` – entry point; automatically records today's visit and renders the result

**How to review:** Reload the page. Stats should update to `1` and the "Last check-in" date should show today's date. Reload again — numbers should not change (already counted today).

**Status:** ⬜ Pending

---

## Step 5 – Automatic Visit Detection

**Goal:** Replace any manual trigger with passive detection — visiting the site is enough.

Behaviour:

- `StreakCounter.checkIn()` is called automatically when the page loads (no button required)
- A status message tells the user whether today's visit was new or already counted
- Returning to the page the same day shows a "visit already counted" message; stats don't change

**How to review:** Open the page for the first time today — streak should increment and a success message should appear. Refresh — the message should change to "already counted" and the streak should not change.

**Status:** ✅ Complete

---

## Step 6 – Unit Tests

**Goal:** Validate all streak logic with automated tests that require no browser.

Files to create:

- `browser_based_ai_development/streak.test.js` – self-contained tests runnable with `node streak.test.js`
- `browser_based_ai_development/streak.test.html` – optional browser test runner

Test cases to cover:

- `daysBetween()` – consecutive days, same day, reverse order, one week apart
- `checkIn()` – first check-in ever
- `checkIn()` – same day twice (idempotent)
- `checkIn()` – consecutive days extend the streak
- `checkIn()` – missing a day resets the streak
- `getState()` – recalculates a stale streak on load
- `reset()` – clears all persisted data

**How to review:** Run `node streak.test.js` in your terminal from the `browser_based_ai_development/` folder. All tests should print `✅ PASS` and exit with code `0`.

**Status:** ✅ Complete
