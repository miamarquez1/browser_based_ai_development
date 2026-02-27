(() => {
  const formatDate = (isoDate) => {
    if (!isoDate) return "Never";
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "Never";
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const animatePop = (el) => {
    if (!el?.animate) return;
    el.animate(
      [
        { transform: "scale(1)", offset: 0 },
        { transform: "scale(1.08)", offset: 0.4 },
        { transform: "scale(1)", offset: 1 },
      ],
      { duration: 220, easing: "ease-out" },
    );
  };

  const animateCount = (el, from, to, duration = 450) => {
    if (!el || typeof requestAnimationFrame === "undefined") return;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const val = Math.round(from + (to - from) * t);
      el.textContent = val;
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = from;
    requestAnimationFrame(step);
  };

  const renderState = (state, animate) => {
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    const streakEl = document.getElementById("current-streak");
    const isFirstDay =
      state.currentStreak === 1 && (state.totalCheckins ?? 0) === 1;

    if (animate && isFirstDay) {
      animateCount(streakEl, 0, 1);
    } else {
      setText("current-streak", state.currentStreak ?? 0);
    }

    setText("longest-streak", state.longestStreak ?? 0);
    setText("total-checkins", state.totalCheckins ?? 0);
    setText("last-checkin-date", formatDate(state.lastCheckinDate));

    if (animate && !isFirstDay) animatePop(streakEl);
  };

  const setMessage = (alreadyCheckedIn) => {
    const el = document.getElementById("visit-msg");
    if (!el) return;
    el.textContent = alreadyCheckedIn
      ? "Today's visit is already counted."
      : "New visit recorded. Keep the wheel spinning!";
  };

  const initializeUI = () => {
    if (!window.StreakCounter?.checkIn) return;
    const result = StreakCounter.checkIn();
    const state = result?.state || StreakCounter.getState?.() || {};
    renderState(state, !result?.alreadyCheckedIn);
    setMessage(result?.alreadyCheckedIn);
    if (typeof StreakCounter.refreshWeekStrip === "function") {
      StreakCounter.refreshWeekStrip();
    }
  };

  document.addEventListener("DOMContentLoaded", initializeUI);
})();
