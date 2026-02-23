/**
 * app.js – Wires the StreakCounter model to the DOM.
 *
 * Responsibilities:
 *   • Render current stats on page load
 *   • Handle the "Check In Today" button
 *   • Disable the button when the user has already checked in today
 *   • Play a brief animation when stats update
 */

(function () {
  const checkinBtn = document.getElementById('checkin-btn');
  const checkinMsg = document.getElementById('checkin-msg');
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

  /** Updates the check-in button based on whether the user already checked in today. */
  function updateButton(state) {
    const checkedInToday = state.lastCheckinDate === StreakCounter.today();
    checkinBtn.disabled = checkedInToday;
    checkinBtn.textContent = checkedInToday ? '✅ Checked In Today' : 'Check In Today';
  }

  /** Initialises the UI on page load. */
  function initializeUI() {
    const state = StreakCounter.getState();
    renderState(state, false);
    updateButton(state);
  }

  /** Handles the check-in button click. */
  checkinBtn.addEventListener('click', () => {
    const { state, alreadyCheckedIn } = StreakCounter.checkIn();

    renderState(state, !alreadyCheckedIn);
    updateButton(state);

    checkinMsg.className = 'checkin-msg';

    if (alreadyCheckedIn) {
      checkinMsg.classList.add('error');
      checkinMsg.textContent = "You've already checked in today. Come back tomorrow! 🗓";
    } else {
      checkinMsg.textContent =
        state.currentStreak > 1
          ? `🔥 ${state.currentStreak}-day streak! Keep it up!`
          : '✅ Check-in recorded! Start your streak!';
    }
  });

  initializeUI();
})();
