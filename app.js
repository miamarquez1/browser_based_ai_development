/**
 * app.js – Wires the StreakCounter model to the DOM.
 *
 * Responsibilities:
 *   • Automatically record a visit when the page loads
 *   • Render current stats on page load
 *   • Play a brief animation when a new day's visit is recorded
 */

(function () {
  const visitMsgEl = document.getElementById('visit-msg');
  const currentStreakEl = document.getElementById('current-streak');
  const longestStreakEl = document.getElementById('longest-streak');
  const totalCheckinsEl = document.getElementById('total-checkins');
  const lastCheckinDateEl = document.getElementById('last-checkin-date');

  /** Formats an ISO date string (YYYY-MM-DD) to a human-readable value. */
  function formatDate(isoDate) {
    if (!isoDate) return 'Never';
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /** Triggers the pop animation on a stat value element. */
  function animatePop(el) {
    el.classList.remove('pop');
    // Force reflow so the animation restarts even if it was already applied
    void el.offsetWidth;
    el.classList.add('pop');
    el.addEventListener('animationend', () => el.classList.remove('pop'), { once: true });
  }

  /** Renders streak stats to the DOM. */
  function renderState(state, animate) {
    currentStreakEl.textContent = state.currentStreak;
    longestStreakEl.textContent = state.longestStreak;
    totalCheckinsEl.textContent = state.totalCheckins;
    lastCheckinDateEl.textContent = formatDate(state.lastCheckinDate);

    if (animate) {
      animatePop(currentStreakEl);
      animatePop(longestStreakEl);
      animatePop(totalCheckinsEl);
    }
  }

  /** Initialises the UI: records today's visit automatically, then renders stats. */
  function initializeUI() {
    const { state, alreadyCheckedIn } = StreakCounter.checkIn();

    renderState(state, !alreadyCheckedIn);

    if (alreadyCheckedIn) {
      visitMsgEl.textContent = `🔥 ${state.currentStreak}-day streak - visit already counted for today!`;
    } else {
      visitMsgEl.textContent =
        state.currentStreak > 1
          ? `🔥 ${state.currentStreak}-day streak! Keep coming back!`
          : '✅ Visit recorded! Start your streak by coming back tomorrow!';
    }
  }

  initializeUI();
})();

