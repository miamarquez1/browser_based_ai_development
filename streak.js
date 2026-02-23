/**
 * streak.js – Streak Counter data model & calculation logic
 *
 * Public API:
 *   StreakCounter.load()       → loads state from localStorage
 *   StreakCounter.save(state)  → persists state to localStorage
 *   StreakCounter.checkIn()    → records today's check-in; returns updated state
 *   StreakCounter.getState()   → returns current in-memory state
 *   StreakCounter.reset()      → clears all data (useful for testing)
 */

/* eslint-disable no-unused-vars */
const StreakCounter = (() => {
  const STORAGE_KEY = 'streakCounter';

  /** @typedef {{ currentStreak: number, longestStreak: number, totalCheckins: number, lastCheckinDate: string|null, checkinDates: string[] }} StreakState */

  /** Returns today's date as an ISO date string (YYYY-MM-DD). */
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Returns the difference in whole calendar days between two ISO date strings.
   * Positive when dateB is later than dateA.
   */
  function daysBetween(dateA, dateB) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const a = new Date(dateA);
    const b = new Date(dateB);
    // Use UTC midnight to avoid DST shifts
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((utcB - utcA) / msPerDay);
  }

  /** Returns the default empty state. */
  function defaultState() {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckins: 0,
      lastCheckinDate: null,
      checkinDates: [],
    };
  }

  /** Loads and returns state from localStorage (or default state if none exists). */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (_e) {
      return defaultState();
    }
  }

  /** Persists the given state to localStorage. */
  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /**
   * Recalculates currentStreak based on lastCheckinDate.
   * If the last check-in was not yesterday or today, the streak resets to 0.
   */
  function recalculateStreak(state) {
    const todayStr = today();
    if (!state.lastCheckinDate) {
      state.currentStreak = 0;
      return state;
    }
    const diff = daysBetween(state.lastCheckinDate, todayStr);
    if (diff > 1) {
      // Missed at least one day – streak broken
      state.currentStreak = 0;
    }
    return state;
  }

  /**
   * Records a check-in for today.
   * Returns an object: { state, alreadyCheckedIn }
   *   - alreadyCheckedIn: true if the user already checked in today
   */
  function checkIn() {
    const state = load();
    const todayStr = today();

    recalculateStreak(state);

    if (state.lastCheckinDate === todayStr) {
      return { state, alreadyCheckedIn: true };
    }

    // Extend or start streak
    state.currentStreak += 1;
    state.totalCheckins += 1;
    state.lastCheckinDate = todayStr;

    // Use a Set to avoid duplicates in O(1) time, then serialise back to array
    const dateSet = new Set(state.checkinDates);
    dateSet.add(todayStr);
    state.checkinDates = Array.from(dateSet);

    if (state.currentStreak > state.longestStreak) {
      state.longestStreak = state.currentStreak;
    }

    save(state);
    return { state, alreadyCheckedIn: false };
  }

  /** Returns the current in-memory state (after recalculating the streak). */
  function getState() {
    const state = load();
    return recalculateStreak(state);
  }

  /** Clears all persisted data and returns a fresh default state. */
  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return defaultState();
  }

  return { load, save, checkIn, getState, reset, daysBetween, today };
})();
