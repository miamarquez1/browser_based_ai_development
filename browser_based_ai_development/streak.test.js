// Minimal DOM/localStorage stubs for Node
const storage = {};
global.localStorage = {
  getItem: (k) =>
    Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null,
  setItem: (k, v) => {
    storage[k] = String(v);
  },
  removeItem: (k) => {
    delete storage[k];
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
};
global.document = {
  querySelectorAll: () => [],
  getElementById: () => null,
};
global.window = global;
require("./streak.js");
const { StreakCounter } = global.window;

// Helpers
const toISODateLocal = (dateLike) => {
  const d = new Date(dateLike);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const test = (name, fn) => tests.push({ name, fn });
const tests = [];

const resetEnv = () => {
  localStorage.clear();
  if (typeof StreakCounter.reset === "function") StreakCounter.reset();
};

// Tests
test("daysBetween – consecutive forward/backward and same day", () => {
  assert(
    StreakCounter.daysBetween("2023-01-01", "2023-01-02") === 1,
    "forward diff",
  );
  assert(
    StreakCounter.daysBetween("2023-01-02", "2023-01-01") === -1,
    "reverse diff",
  );
  assert(
    StreakCounter.daysBetween("2023-01-02", "2023-01-02") === 0,
    "same day",
  );
});

test("checkIn – first visit initializes streak", () => {
  resetEnv();
  const { state, alreadyCheckedIn } = StreakCounter.checkIn();
  assert(
    alreadyCheckedIn === false,
    "first visit should not be marked as already",
  );
  assert(state.currentStreak === 1, "currentStreak should be 1");
  assert(state.longestStreak === 1, "longestStreak should be 1");
  assert(state.totalCheckins === 1, "totalCheckins should be 1");
  assert(
    StreakCounter.daysBetween(state.lastCheckinDate, new Date()) === 0,
    "lastCheckinDate is today",
  );
});

test("checkIn – same day is idempotent", () => {
  resetEnv();
  StreakCounter.checkIn();
  const second = StreakCounter.checkIn();
  assert(second.alreadyCheckedIn === true, "should flag already checked in");
  assert(second.state.currentStreak === 1, "streak unchanged");
  assert(second.state.totalCheckins === 1, "totalCheckins unchanged");
});

test("checkIn – consecutive day extends streak", () => {
  resetEnv();
  const yesterday = toISODateLocal(Date.now() - 24 * 60 * 60 * 1000);
  localStorage.setItem(
    "streak",
    JSON.stringify({
      currentStreak: 1,
      longestStreak: 1,
      totalCheckins: 1,
      lastCheckinDate: yesterday,
      checkinDates: [yesterday],
    }),
  );
  const { state, alreadyCheckedIn } = StreakCounter.checkIn();
  assert(
    alreadyCheckedIn === false,
    "new day should not be already checked in",
  );
  assert(state.currentStreak === 2, "streak increments to 2");
  assert(state.longestStreak === 2, "longest updates to 2");
  assert(state.totalCheckins === 2, "totalCheckins increments");
});

test("checkIn – missing a day resets streak", () => {
  resetEnv();
  const twoDaysAgo = toISODateLocal(Date.now() - 2 * 24 * 60 * 60 * 1000);
  localStorage.setItem(
    "streak",
    JSON.stringify({
      currentStreak: 3,
      longestStreak: 3,
      totalCheckins: 3,
      lastCheckinDate: twoDaysAgo,
      checkinDates: [twoDaysAgo],
    }),
  );
  const { state } = StreakCounter.checkIn();
  assert(state.currentStreak === 1, "streak restarts at 1 after gap");
  assert(state.longestStreak === 3, "longest preserved");
  assert(state.totalCheckins === 4, "totalCheckins increments");
});

test("getState – recalculates stale streak on load", () => {
  resetEnv();
  const twoDaysAgo = toISODateLocal(Date.now() - 2 * 24 * 60 * 60 * 1000);
  localStorage.setItem(
    "streak",
    JSON.stringify({
      currentStreak: 4,
      longestStreak: 5,
      totalCheckins: 7,
      lastCheckinDate: twoDaysAgo,
      checkinDates: [twoDaysAgo],
    }),
  );
  const state = StreakCounter.getState();
  assert(state.currentStreak === 0, "stale streak resets to 0");
  assert(state.longestStreak === 5, "longest preserved");
});

test("reset – clears persisted data", () => {
  resetEnv();
  StreakCounter.checkIn();
  StreakCounter.reset();
  const state = StreakCounter.getState();
  assert(state.currentStreak === 0, "currentStreak cleared");
  assert(state.totalCheckins === 0, "totalCheckins cleared");
  assert(state.longestStreak === 0, "longestStreak cleared");
  assert(state.lastCheckinDate === null, "lastCheckinDate cleared");
});

// Runner
(async () => {
  let passed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ PASS - ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL - ${name}: ${err.message}`);
      process.exitCode = 1;
      break;
    }
  }
  if (process.exitCode !== 1) {
    console.log(`\nAll ${passed} tests passed.`);
  }
})();
