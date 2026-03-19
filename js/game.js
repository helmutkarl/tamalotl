(function () {
  var Tamalotl = (window.Tamalotl = window.Tamalotl || {});
  var CONFIG = Tamalotl.CONFIG;
  var PROGRESSION = CONFIG.progression;

  function clamp(value) {
    return Math.max(CONFIG.minStat, Math.min(CONFIG.maxStat, value));
  }

  function createInitialState(now) {
    var state = {
      version: 2,
      petName: CONFIG.petName,
      stats: copyStats(CONFIG.initialStats),
      status: "happy",
      message: CONFIG.moodMessages.happy[0],
      recentAction: null,
      progress: createInitialProgress(),
      lastUpdated: now,
    };

    return updateDerivedState(state, now);
  }

  function createInitialProgress() {
    return buildProgressState(
      {
        xp: 0,
        recentLevelUp: null,
      },
      0
    );
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
    base.progress = normalizeProgress(rawState.progress, rawState, now);

    return updateDerivedState(base, now);
  }

  function normalizeProgress(rawProgress, rawState, now) {
    var source = rawProgress && typeof rawProgress === "object" ? rawProgress : rawState || {};

    return buildProgressState(
      {
        xp: numberOrFallback(source.xp, 0),
        recentLevelUp: normalizeRecentLevelUp(source.recentLevelUp),
      },
      now
    );
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

  function normalizeRecentLevelUp(recentLevelUp) {
    if (!recentLevelUp || typeof recentLevelUp !== "object") {
      return null;
    }

    var level = Math.max(1, Math.round(numberOrFallback(recentLevelUp.level, 1)));
    var unlockIds = getValidUnlockIds(recentLevelUp.unlockIds);

    return {
      level: level,
      unlockIds: unlockIds,
      text:
        typeof recentLevelUp.text === "string"
          ? recentLevelUp.text
          : buildLevelUpText(level, unlockIds),
      expiresAt: numberOrFallback(recentLevelUp.expiresAt, 0),
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
        progress: safeState.progress,
        lastUpdated: now,
      },
      now
    );
  }

  function applyAction(state, actionName, now) {
    var progressedState = applyElapsedTime(state, now);
    var effects = CONFIG.actionEffects[actionName];
    var xpReward = getXpReward(actionName);

    if (!effects && xpReward <= 0) {
      return progressedState;
    }

    var nextStats = copyStats(progressedState.stats);
    var nextAction = progressedState.recentAction;

    if (effects) {
      Object.keys(effects).forEach(function (statName) {
        nextStats[statName] = clamp(nextStats[statName] + effects[statName]);
      });

      nextAction = {
        type: actionName,
        text: CONFIG.actionMessages[actionName],
        expiresAt: now + 5000,
      };
    }

    return updateDerivedState(
      {
        version: progressedState.version,
        petName: progressedState.petName,
        stats: nextStats,
        status: progressedState.status,
        message: progressedState.message,
        recentAction: nextAction,
        progress: applyProgressReward(progressedState.progress, actionName, now),
        lastUpdated: now,
      },
      now
    );
  }

  function updateDerivedState(state, now) {
    var progress = buildProgressState(state.progress, now);
    var status = getStatus(state.stats);
    var hasActiveLevelUp =
      progress.recentLevelUp && Number(progress.recentLevelUp.expiresAt) > now;
    var hasActiveActionMessage =
      state.recentAction && Number(state.recentAction.expiresAt) > now;

    // Level-up feedback comes first, then action reactions, then a mood line.
    return {
      version: state.version || 2,
      petName: state.petName || CONFIG.petName,
      stats: copyStats(state.stats),
      status: status,
      message: hasActiveLevelUp
        ? progress.recentLevelUp.text
        : hasActiveActionMessage
        ? state.recentAction.text
        : getMoodMessage(status, state.stats, progress),
      recentAction: hasActiveActionMessage ? state.recentAction : null,
      progress: progress,
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

  function getMoodMessage(status, stats, progress) {
    var options = CONFIG.moodMessages[status] || CONFIG.moodMessages.happy;
    var unlockMoodMessages = getUnlockMoodMessages(progress.unlocks, status);
    var fullOptions = options.concat(unlockMoodMessages);
    var seed = Math.round(
      stats.hunger + stats.happiness + stats.energy + stats.cleanliness + progress.level
    );
    var index = seed % fullOptions.length;

    return fullOptions[index];
  }

  function applyProgressReward(progress, actionName, now) {
    var currentProgress = buildProgressState(progress, now);
    var gainedXp = getXpReward(actionName);

    if (gainedXp <= 0) {
      return buildProgressState(
        {
          xp: currentProgress.xp,
          recentLevelUp: currentProgress.recentLevelUp,
        },
        now
      );
    }

    var nextXp = currentProgress.xp + gainedXp;
    var nextProgress = buildProgressState(
      {
        xp: nextXp,
        recentLevelUp: currentProgress.recentLevelUp,
      },
      now
    );

    if (nextProgress.level > currentProgress.level) {
      nextProgress = buildProgressState(
        {
          xp: nextXp,
          recentLevelUp: createRecentLevelUp(
            nextProgress.level,
            getNewUnlockIds(currentProgress.unlocks, nextProgress.unlocks),
            now
          ),
        },
        now
      );
    }

    return nextProgress;
  }

  function createRecentLevelUp(level, unlockIds, now) {
    var validUnlockIds = getValidUnlockIds(unlockIds);

    return {
      level: level,
      unlockIds: validUnlockIds,
      text: buildLevelUpText(level, validUnlockIds),
      expiresAt: now + PROGRESSION.levelUpMessageMs,
    };
  }

  function buildProgressState(progress, now) {
    var safeProgress = progress && typeof progress === "object" ? progress : {};
    var xp = Math.max(0, Math.round(numberOrFallback(safeProgress.xp, 0)));
    var levelData = getLevelDataFromXp(xp);
    var unlocks = getUnlockedIdsForLevel(levelData.level);
    var nextUnlock = getNextUnlock(levelData.level);
    var recentLevelUp = normalizeRecentLevelUp(safeProgress.recentLevelUp);

    if (!recentLevelUp || Number(recentLevelUp.expiresAt) <= now) {
      recentLevelUp = null;
    }

    return {
      xp: xp,
      level: levelData.level,
      currentLevelXp: levelData.currentLevelXp,
      xpForNextLevel: levelData.xpForNextLevel,
      nextLevel: levelData.level + 1,
      unlocks: unlocks,
      unlockDetails: getUnlockDetails(unlocks),
      nextUnlock: nextUnlock ? copyUnlock(nextUnlock) : null,
      recentLevelUp: recentLevelUp,
    };
  }

  function getLevelDataFromXp(xp) {
    var level = 1;
    var spentXp = 0;
    var xpForNextLevel = getXpForNextLevel(level);

    while (xp >= spentXp + xpForNextLevel) {
      spentXp += xpForNextLevel;
      level += 1;
      xpForNextLevel = getXpForNextLevel(level);
    }

    return {
      level: level,
      currentLevelXp: xp - spentXp,
      xpForNextLevel: xpForNextLevel,
    };
  }

  function getXpForNextLevel(level) {
    return PROGRESSION.baseXpForNextLevel + PROGRESSION.xpGrowthPerLevel * (level - 1);
  }

  function getXpReward(actionName) {
    return Math.max(0, numberOrFallback(PROGRESSION.actionXp[actionName], 0));
  }

  function getUnlockedIdsForLevel(level) {
    return PROGRESSION.unlocks
      .filter(function (unlock) {
        return unlock.level <= level;
      })
      .map(function (unlock) {
        return unlock.id;
      });
  }

  function getUnlockDetails(unlockIds) {
    var lookup = arrayToLookup(getValidUnlockIds(unlockIds));

    return PROGRESSION.unlocks.filter(function (unlock) {
      return lookup[unlock.id];
    }).map(copyUnlock);
  }

  function getValidUnlockIds(unlockIds) {
    var lookup = arrayToLookup(Array.isArray(unlockIds) ? unlockIds : []);

    return PROGRESSION.unlocks.filter(function (unlock) {
      return lookup[unlock.id];
    }).map(function (unlock) {
      return unlock.id;
    });
  }

  function getNewUnlockIds(previousUnlocks, nextUnlocks) {
    var previousLookup = arrayToLookup(previousUnlocks);

    return getValidUnlockIds(nextUnlocks).filter(function (unlockId) {
      return !previousLookup[unlockId];
    });
  }

  function getNextUnlock(level) {
    for (var index = 0; index < PROGRESSION.unlocks.length; index += 1) {
      if (PROGRESSION.unlocks[index].level > level) {
        return PROGRESSION.unlocks[index];
      }
    }

    return null;
  }

  function getUnlockMoodMessages(unlockIds, status) {
    return getValidUnlockIds(unlockIds).reduce(function (messages, unlockId) {
      var unlock = getUnlockById(unlockId);

      if (!unlock || !unlock.moodMessages || !unlock.moodMessages[status]) {
        return messages;
      }

      return messages.concat(unlock.moodMessages[status]);
    }, []);
  }

  function getUnlockById(unlockId) {
    for (var index = 0; index < PROGRESSION.unlocks.length; index += 1) {
      if (PROGRESSION.unlocks[index].id === unlockId) {
        return PROGRESSION.unlocks[index];
      }
    }

    return null;
  }

  function copyUnlock(unlock) {
    return {
      id: unlock.id,
      level: unlock.level,
      title: unlock.title,
      description: unlock.description,
    };
  }

  function buildLevelUpText(level, unlockIds) {
    var unlockTitles = getUnlockDetails(unlockIds).map(function (unlock) {
      return unlock.title;
    });

    if (!unlockTitles.length) {
      return "Level " + level + "! Tamalotl looks extra proud.";
    }

    if (unlockTitles.length === 1) {
      return "Level " + level + "! New unlock: " + unlockTitles[0] + ".";
    }

    return "Level " + level + "! New unlocks: " + unlockTitles.join(", ") + ".";
  }

  function arrayToLookup(items) {
    return (Array.isArray(items) ? items : []).reduce(function (lookup, item) {
      lookup[item] = true;
      return lookup;
    }, {});
  }

  Tamalotl.Game = {
    createInitialState: createInitialState,
    normalizeState: normalizeState,
    tick: tick,
    applyAction: applyAction,
    getStatus: getStatus,
  };
})();
