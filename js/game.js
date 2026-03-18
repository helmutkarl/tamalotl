(function () {
  var Tamalotl = (window.Tamalotl = window.Tamalotl || {});
  var CONFIG = Tamalotl.CONFIG;

  function clamp(value) {
    return Math.max(CONFIG.minStat, Math.min(CONFIG.maxStat, value));
  }

  function createInitialState(now) {
    var state = {
      version: 1,
      petName: CONFIG.petName,
      stats: copyStats(CONFIG.initialStats),
      status: "happy",
      message: CONFIG.moodMessages.happy[0],
      recentAction: null,
      lastUpdated: now,
    };

    return updateDerivedState(state, now);
  }

  function copyStats(stats) {
    return {
      hunger: Number(stats.hunger),
      happiness: Number(stats.happiness),
      energy: Number(stats.energy),
      cleanliness: Number(stats.cleanliness),
    };
  }

  function normalizeState(rawState, now) {
    if (!rawState || typeof rawState !== "object") {
      return createInitialState(now);
    }

    var base = createInitialState(now);
    var rawStats = rawState.stats || {};

    base.stats = {
      hunger: clamp(numberOrFallback(rawStats.hunger, base.stats.hunger)),
      happiness: clamp(numberOrFallback(rawStats.happiness, base.stats.happiness)),
      energy: clamp(numberOrFallback(rawStats.energy, base.stats.energy)),
      cleanliness: clamp(numberOrFallback(rawStats.cleanliness, base.stats.cleanliness)),
    };

    base.lastUpdated = numberOrFallback(rawState.lastUpdated, now);
    base.recentAction = normalizeRecentAction(rawState.recentAction);

    return updateDerivedState(base, now);
  }

  function normalizeRecentAction(recentAction) {
    if (!recentAction || typeof recentAction !== "object") {
      return null;
    }

    if (typeof recentAction.text !== "string") {
      return null;
    }

    return {
      type: typeof recentAction.type === "string" ? recentAction.type : "",
      text: recentAction.text,
      expiresAt: numberOrFallback(recentAction.expiresAt, 0),
    };
  }

  function numberOrFallback(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function tick(state, now) {
    return applyElapsedTime(state, now);
  }

  function applyElapsedTime(state, now) {
    // Recalculate from the last saved timestamp so reloads keep time passing.
    var safeState = normalizeState(state, now);
    var elapsedMs = Math.max(0, now - safeState.lastUpdated);
    var elapsedMinutes = elapsedMs / 60000;
    var nextStats = copyStats(safeState.stats);

    if (elapsedMinutes > 0) {
      Object.keys(nextStats).forEach(function (statName) {
        nextStats[statName] = clamp(
          nextStats[statName] - CONFIG.decayPerMinute[statName] * elapsedMinutes
        );
      });
    }

    return updateDerivedState(
      {
        version: safeState.version,
        petName: safeState.petName,
        stats: nextStats,
        status: safeState.status,
        message: safeState.message,
        recentAction: safeState.recentAction,
        lastUpdated: now,
      },
      now
    );
  }

  function applyAction(state, actionName, now) {
    var progressedState = applyElapsedTime(state, now);
    var effects = CONFIG.actionEffects[actionName];

    if (!effects) {
      return progressedState;
    }

    var nextStats = copyStats(progressedState.stats);

    Object.keys(effects).forEach(function (statName) {
      nextStats[statName] = clamp(nextStats[statName] + effects[statName]);
    });

    return updateDerivedState(
      {
        version: progressedState.version,
        petName: progressedState.petName,
        stats: nextStats,
        status: progressedState.status,
        message: progressedState.message,
        recentAction: {
          type: actionName,
          text: CONFIG.actionMessages[actionName],
          expiresAt: now + 5000,
        },
        lastUpdated: now,
      },
      now
    );
  }

  function updateDerivedState(state, now) {
    var status = getStatus(state.stats);
    var hasActiveActionMessage =
      state.recentAction && Number(state.recentAction.expiresAt) > now;

    // Short action reactions take priority, then we fall back to a mood line.
    return {
      version: state.version || 1,
      petName: state.petName || CONFIG.petName,
      stats: copyStats(state.stats),
      status: status,
      message: hasActiveActionMessage
        ? state.recentAction.text
        : getMoodMessage(status, state.stats),
      recentAction: hasActiveActionMessage ? state.recentAction : null,
      lastUpdated: state.lastUpdated,
    };
  }

  function getStatus(stats) {
    var thresholds = CONFIG.thresholds;

    if (stats.hunger <= thresholds.urgent) {
      return "hungry";
    }

    if (stats.energy <= thresholds.urgent) {
      return "sleepy";
    }

    if (stats.cleanliness <= thresholds.urgent) {
      return "dirty";
    }

    if (
      stats.happiness >= thresholds.happy &&
      stats.hunger >= thresholds.low &&
      stats.energy >= thresholds.low &&
      stats.cleanliness >= thresholds.low
    ) {
      return "happy";
    }

    return getLowestNeed(stats);
  }

  function getLowestNeed(stats) {
    var priorities = [
      { key: "hunger", state: "hungry" },
      { key: "energy", state: "sleepy" },
      { key: "cleanliness", state: "dirty" },
    ];

    priorities.sort(function (a, b) {
      return stats[a.key] - stats[b.key];
    });

    return priorities[0].state;
  }

  function getMoodMessage(status, stats) {
    var options = CONFIG.moodMessages[status] || CONFIG.moodMessages.happy;
    var seed = Math.round(
      stats.hunger + stats.happiness + stats.energy + stats.cleanliness
    );
    var index = seed % options.length;

    return options[index];
  }

  Tamalotl.Game = {
    createInitialState: createInitialState,
    normalizeState: normalizeState,
    tick: tick,
    applyAction: applyAction,
    getStatus: getStatus,
  };
})();
