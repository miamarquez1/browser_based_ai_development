/**
 * streak.js – Streak Counter data model (Step 2: persistence layer)
 *
 * Public API (so far):
 *   StreakCounter.defaultState() → returns a fresh default state object
 *   StreakCounter.load()         → loads state from localStorage (falls back to default)
 *   StreakCounter.save(state)    → persists state to localStorage
 */

/* eslint-disable no-unused-vars */
const StreakCounter = (() => {
  const STORAGE_KEY = 'streakCounter';

  /**
   * @typedef {{
   *   currentStreak:  number,
   *   longestStreak:  number,
   *   totalCheckins:  number,
   *   lastCheckinDate: string|null,
   *   checkinDates:   string[]
   * }} StreakState
   */

  /** Returns a fresh default state object. */
  function defaultState() {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckins: 0,
      lastCheckinDate: null,
      checkinDates: [],
    };
  }

  /**
   * Loads streak state from localStorage.
   * Returns the stored state merged with defaults, or a plain default
   * state if nothing has been saved yet or the stored value is corrupt.
   */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (_e) {
      return defaultState();
    }
  }

  /** Persists the given state object to localStorage. */
  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  return { defaultState, load, save };
})();
