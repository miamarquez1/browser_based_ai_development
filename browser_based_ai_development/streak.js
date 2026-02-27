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
  const STORAGE_KEY = "streakCounter";

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

// Week strip tracking (per-visit history)
(() => {
  const HISTORY_KEY = "streakHistory";
  const WEEK_LABELS = ["M", "T", "W", "Th", "F", "S", "Su"];

  const safeParseArray = (value, fallback) => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const safeParseObject = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const toISODateLocal = (dateLike) => {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseLocalDate = (isoDate) => {
    if (!isoDate || typeof isoDate !== "string") return null;
    const [y, m, d] = isoDate.split("-").map(Number);
    if (![y, m, d].every(Number.isFinite)) return null;
    const dt = new Date(y, m - 1, d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const startOfWeekMonday = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - day);
    return d;
  };

  const weekVisits = (history, weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const visits = new Set();
    history.forEach((dateStr) => {
      const d = parseLocalDate(dateStr);
      if (!d) return;
      if (d >= weekStart && d <= weekEnd) {
        const label = WEEK_LABELS[(d.getDay() + 6) % 7];
        visits.add(label);
      }
    });
    return visits;
  };

  const renderWeekStrip = (visits) => {
    document.querySelectorAll(".week-day").forEach((el) => {
      const label = el.dataset.day;
      const mark = el.querySelector(".day-mark");
      const visited = visits.has(label);
      el.classList.toggle("checked", visited);
      if (mark) mark.textContent = visited ? "🔥" : "●";
    });
  };

  const persistHistory = (history) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* ignore */
    }
  };

  const getHistory = () =>
    safeParseArray(localStorage.getItem(HISTORY_KEY), []);

  const recordVisitForWeek = (iso) => {
    if (!iso) return;
    const history = getHistory();
    if (!history.includes(iso)) {
      history.push(iso);
      persistHistory(history);
    }
  };

  const addCurrentStreakToHistory = (history) => {
    const storedStreak = safeParseObject(localStorage.getItem("streak"));
    const currentStreak = storedStreak?.currentStreak;
    if (!currentStreak || currentStreak <= 0) return history;

    const lastRaw =
      storedStreak.lastVisit ||
      storedStreak.lastDate ||
      storedStreak.lastCheckInDate;
    const lastISO = toISODateLocal(lastRaw);
    if (!lastISO) return history;

    for (let i = 0; i < Math.min(currentStreak, 7); i++) {
      const d = parseLocalDate(lastISO);
      if (!d) break;
      d.setDate(d.getDate() - i);
      const iso = toISODateLocal(d);
      if (iso && !history.includes(iso)) history.push(iso);
    }
    persistHistory(history);
    return history;
  };

  const refreshWeekStrip = () => {
    if (typeof localStorage === "undefined") return;
    const history = addCurrentStreakToHistory(
      safeParseArray(localStorage.getItem(HISTORY_KEY), []),
    );
    const weekStart = startOfWeekMonday(new Date());
    renderWeekStrip(weekVisits(history, weekStart));
  };

  const checkIn = () => {
    const today = todayISO();

    // First-ever visit: start at 1 and persist immediately
    if (!state.lastCheckinDate) {
      state.currentStreak = 1;
      state.longestStreak = 1;
      state.totalCheckins = 1;
      state.lastCheckinDate = today;
      state.checkinDates = [today];
      save(state);
      window.StreakCounter?.recordVisitForWeek?.(today);
      window.StreakCounter?.refreshWeekStrip?.();
      return { state, alreadyCheckedIn: false };
    }

    const alreadyCheckedIn = state.lastCheckinDate === today;
    if (alreadyCheckedIn) return { state, alreadyCheckedIn: true };

    const diff = daysBetween(state.lastCheckinDate, today);
    if (diff === 1) {
      state.currentStreak += 1;
    } else {
      state.currentStreak = 1;
    }

    state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
    state.totalCheckins = (state.totalCheckins || 0) + 1;
    state.lastCheckinDate = today;
    state.checkinDates = Array.from(
      new Set([...(state.checkinDates || []), today]),
    );

    if (state.currentStreak < 1) state.currentStreak = 1;
    if (state.totalCheckins < 1) state.totalCheckins = 1;

    save(state);
    window.StreakCounter?.recordVisitForWeek?.(today);
    window.StreakCounter?.refreshWeekStrip?.();
    return { state, alreadyCheckedIn: false };
  };

  if (typeof window !== "undefined") {
    window.StreakCounter = window.StreakCounter || {};
    window.StreakCounter.refreshWeekStrip = refreshWeekStrip;
    window.StreakCounter.recordVisitForWeek = recordVisitForWeek;
  }

  refreshWeekStrip();
})();
