/**
 * streak.test.js – Self-contained unit tests for streak.js
 *
 * Run in a browser: open streak.test.html
 * Run with Node.js: node streak.test.js
 *
 * No external test framework required.
 */

// ── Node.js compatibility shim ────────────────────────────────────────────────
// When running under Node (e.g. `node streak.test.js`) we supply a minimal
// localStorage mock and then inline the module source so the tests work
// without a bundler.
if (typeof window === 'undefined') {
  // Minimal localStorage mock
  const store = {};
  global.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };

  // Load streak.js into this Node context and expose StreakCounter globally.
  // `const` inside eval() is block-scoped so we append an assignment to
  // global so the rest of the test file can access it.
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, 'streak.js'), 'utf8');
  // eslint-disable-next-line no-eval
  eval(src + '; global.StreakCounter = StreakCounter;');
}

// ── Tiny test harness ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function describe(suiteName, fn) {
  console.log(`\n▸ ${suiteName}`);
  fn();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Returns an ISO date string offset by `days` from today. */
function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Seeds localStorage with a custom state for testing. */
function seedState(partial) {
  const defaults = {
    currentStreak: 0,
    longestStreak: 0,
    totalCheckins: 0,
    lastCheckinDate: null,
    checkinDates: [],
  };
  localStorage.setItem('streakCounter', JSON.stringify(Object.assign(defaults, partial)));
}

// ── Test suites ───────────────────────────────────────────────────────────────

describe('daysBetween()', () => {
  assert(StreakCounter.daysBetween('2024-01-01', '2024-01-02') === 1,
    'consecutive days → 1');
  assert(StreakCounter.daysBetween('2024-01-01', '2024-01-08') === 7,
    'one week apart → 7');
  assert(StreakCounter.daysBetween('2024-01-05', '2024-01-01') === -4,
    'reverse order → negative');
  assert(StreakCounter.daysBetween('2024-01-01', '2024-01-01') === 0,
    'same day → 0');
});

describe('checkIn() – first check-in ever', () => {
  StreakCounter.reset();
  const { state, alreadyCheckedIn } = StreakCounter.checkIn();

  assert(!alreadyCheckedIn, 'alreadyCheckedIn is false');
  assert(state.currentStreak === 1, 'currentStreak is 1');
  assert(state.longestStreak === 1, 'longestStreak is 1');
  assert(state.totalCheckins === 1, 'totalCheckins is 1');
  assert(state.lastCheckinDate === StreakCounter.today(), 'lastCheckinDate is today');
});

describe('checkIn() – same day twice', () => {
  StreakCounter.reset();
  StreakCounter.checkIn(); // first
  const { state, alreadyCheckedIn } = StreakCounter.checkIn(); // second

  assert(alreadyCheckedIn, 'alreadyCheckedIn is true');
  assert(state.currentStreak === 1, 'streak stays at 1');
  assert(state.totalCheckins === 1, 'totalCheckins stays at 1');
});

describe('checkIn() – consecutive days extend streak', () => {
  StreakCounter.reset();
  // Seed a check-in from yesterday
  const yesterday = dateOffset(-1);
  seedState({ currentStreak: 3, longestStreak: 3, totalCheckins: 3, lastCheckinDate: yesterday });

  const { state, alreadyCheckedIn } = StreakCounter.checkIn();

  assert(!alreadyCheckedIn, 'alreadyCheckedIn is false');
  assert(state.currentStreak === 4, 'streak increments to 4');
  assert(state.longestStreak === 4, 'longestStreak updated to 4');
  assert(state.totalCheckins === 4, 'totalCheckins increments to 4');
});

describe('checkIn() – missed a day resets streak', () => {
  StreakCounter.reset();
  // Seed a check-in from two days ago (missed yesterday)
  const twoDaysAgo = dateOffset(-2);
  seedState({ currentStreak: 5, longestStreak: 10, totalCheckins: 10, lastCheckinDate: twoDaysAgo });

  const { state } = StreakCounter.checkIn();

  assert(state.currentStreak === 1, 'streak resets to 1 after missed day');
  assert(state.longestStreak === 10, 'longestStreak is preserved');
  assert(state.totalCheckins === 11, 'totalCheckins still increments');
});

describe('getState() – recalculates streak on stale data', () => {
  StreakCounter.reset();
  // Last check-in was 3 days ago – streak should be 0 when loaded
  const threeDaysAgo = dateOffset(-3);
  seedState({ currentStreak: 7, longestStreak: 7, totalCheckins: 7, lastCheckinDate: threeDaysAgo });

  const state = StreakCounter.getState();

  assert(state.currentStreak === 0, 'stale streak resets to 0 on load');
  assert(state.longestStreak === 7, 'longestStreak is preserved');
});

describe('reset() clears all data', () => {
  StreakCounter.checkIn();
  const state = StreakCounter.reset();

  assert(state.currentStreak === 0, 'currentStreak is 0 after reset');
  assert(state.totalCheckins === 0, 'totalCheckins is 0 after reset');
  assert(state.lastCheckinDate === null, 'lastCheckinDate is null after reset');
  assert(localStorage.getItem('streakCounter') === null, 'localStorage cleared');
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n─────────────────────────────────`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  if (typeof process !== 'undefined') process.exit(1);
}
