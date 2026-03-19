(function () {
  var Tamalotl = (window.Tamalotl = window.Tamalotl || {});
  var CONFIG = Tamalotl.CONFIG;

  function createUI() {
    var activeEffectTimeoutId = 0;
    var ambientDanceTimeoutId = 0;
    var activeEffectName = "";
    var lastRenderedStatus = "happy";
    var elements = {
      body: document.body,
      tank: document.querySelector("[data-tank]"),
      pet: document.querySelector("[data-pet]"),
      message: document.querySelector("[data-message]"),
      statusLabel: document.querySelector("[data-status-label]"),
      progressCard: document.querySelector("[data-progress-card]"),
      levelLabel: document.querySelector("[data-level-label]"),
      xpCaption: document.querySelector("[data-xp-caption]"),
      xpMeter: document.querySelector("[data-xp-meter]"),
      xpFill: document.querySelector("[data-xp-fill]"),
      levelUpMessage: document.querySelector("[data-levelup-message]"),
      nextUnlock: document.querySelector("[data-next-unlock]"),
      unlockCount: document.querySelector("[data-unlock-count]"),
      unlockList: document.querySelector("[data-unlock-list]"),
      buttons: Array.prototype.slice.call(
        document.querySelectorAll("[data-action]")
      ),
      statValues: collectElements("[data-stat-value]"),
      statCards: collectElements("[data-stat-card]"),
      meters: collectElements("[data-meter]"),
      meterFills: collectElements("[data-meter-fill]"),
    };

    function scheduleAmbientDance() {
      var minDelay = CONFIG.idleDance.minDelayMs || 7000;
      var maxDelay = CONFIG.idleDance.maxDelayMs || 14000;

      cancelAmbientDance();

      ambientDanceTimeoutId = window.setTimeout(function () {
        ambientDanceTimeoutId = 0;

        if (document.hidden || activeEffectName || lastRenderedStatus === "sleepy") {
          scheduleAmbientDance();
          return;
        }

        startEffect("dance", CONFIG.effectDurations.dance || 1700, false);
      }, randomBetween(minDelay, maxDelay));
    }

    function startEffect(effectName, duration, isAction) {
      clearActionEffect(elements, activeEffectTimeoutId);
      activeEffectName = effectName;
      void elements.tank.offsetWidth;

      elements.tank.dataset.effect = effectName;
      elements.pet.dataset.effect = effectName;

      if (effectName === "sleep") {
        elements.body.dataset.sceneEffect = "sleep";
      }

      if (isAction) {
        activeActionButton(elements.buttons, effectName);
      } else {
        clearActionButtons(elements.buttons);
      }

      activeEffectTimeoutId = window.setTimeout(function () {
        clearActionEffect(elements);
        activeEffectTimeoutId = 0;
        activeEffectName = "";
        scheduleAmbientDance();
      }, duration);
    }

    function cancelAmbientDance() {
      if (ambientDanceTimeoutId) {
        window.clearTimeout(ambientDanceTimeoutId);
        ambientDanceTimeoutId = 0;
      }
    }

    return {
      bindActions: function (onAction) {
        elements.buttons.forEach(function (button) {
          button.addEventListener("click", function () {
            onAction(button.dataset.action);
          });
        });
      },

      bindPetInteraction: function (onPet) {
        elements.pet.addEventListener("click", function () {
          onPet();
        });

        elements.pet.addEventListener("keydown", function (event) {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }

          event.preventDefault();
          onPet();
        });
      },

      startAmbientMotion: function () {
        scheduleAmbientDance();
      },

      playActionEffect: function (actionName) {
        var duration = CONFIG.effectDurations[actionName] || 2200;

        cancelAmbientDance();
        startEffect(actionName, duration, true);
      },

      render: function (state) {
        lastRenderedStatus = state.status;
        elements.pet.dataset.state = state.status;
        elements.message.textContent = state.message;
        elements.statusLabel.textContent = CONFIG.statusLabels[state.status];
        elements.statusLabel.dataset.state = state.status;
        syncWaterState(elements.tank, state.stats.cleanliness);
        renderProgress(elements, state.progress);

        Object.keys(state.stats).forEach(function (statName) {
          var roundedValue = Math.round(state.stats[statName]);
          var level = getLevel(roundedValue);

          if (elements.statValues[statName]) {
            elements.statValues[statName].textContent = roundedValue + "%";
          }

          if (elements.statCards[statName]) {
            elements.statCards[statName].dataset.level = level;
          }

          if (elements.meters[statName]) {
            elements.meters[statName].setAttribute("aria-valuenow", roundedValue);
          }

          if (elements.meterFills[statName]) {
            elements.meterFills[statName].style.width = roundedValue + "%";
          }
        });
      },
    };
  }

  function collectElements(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector)).reduce(
      function (map, element) {
        var key =
          element.dataset.statValue ||
          element.dataset.statCard ||
          element.dataset.meter ||
          element.dataset.meterFill;

        map[key] = element;
        return map;
      },
      {}
    );
  }

  function getLevel(value) {
    if (value <= CONFIG.thresholds.urgent) {
      return "low";
    }

    if (value <= CONFIG.thresholds.happy) {
      return "mid";
    }

    return "high";
  }

  function syncWaterState(tankElement, cleanliness) {
    if (!tankElement) {
      return;
    }

    if (cleanliness <= CONFIG.thresholds.urgent) {
      tankElement.dataset.water = "murky";
      return;
    }

    if (cleanliness <= CONFIG.thresholds.low) {
      tankElement.dataset.water = "cloudy";
      return;
    }

    delete tankElement.dataset.water;
  }

  function renderProgress(elements, progress) {
    var percent = Math.max(
      0,
      Math.min(100, (progress.currentLevelXp / progress.xpForNextLevel) * 100)
    );
    var freshUnlockIds = progress.recentLevelUp ? progress.recentLevelUp.unlockIds : [];

    syncUnlockState(elements, progress.unlocks);

    if (elements.levelLabel) {
      elements.levelLabel.textContent = "Level " + progress.level;
    }

    if (elements.xpCaption) {
      elements.xpCaption.textContent =
        progress.currentLevelXp +
        " / " +
        progress.xpForNextLevel +
        " XP to Level " +
        progress.nextLevel;
    }

    if (elements.xpMeter) {
      elements.xpMeter.setAttribute("aria-valuenow", progress.currentLevelXp);
      elements.xpMeter.setAttribute("aria-valuemax", progress.xpForNextLevel);
    }

    if (elements.xpFill) {
      elements.xpFill.style.width = percent + "%";
    }

    if (elements.nextUnlock) {
      elements.nextUnlock.textContent = progress.nextUnlock
        ? "Next unlock at Level " +
          progress.nextUnlock.level +
          ": " +
          progress.nextUnlock.title
        : "Every current tiny unlock has been found.";
    }

    if (elements.unlockCount) {
      elements.unlockCount.textContent =
        progress.unlockDetails.length + "/" + CONFIG.progression.unlocks.length;
    }

    if (elements.progressCard) {
      if (progress.recentLevelUp) {
        elements.progressCard.dataset.levelup = "true";
      } else {
        delete elements.progressCard.dataset.levelup;
      }
    }

    if (elements.levelUpMessage) {
      if (progress.recentLevelUp) {
        elements.levelUpMessage.hidden = false;
        elements.levelUpMessage.textContent = progress.recentLevelUp.text;
      } else {
        elements.levelUpMessage.hidden = true;
        elements.levelUpMessage.textContent = "";
      }
    }

    renderUnlockList(elements.unlockList, progress.unlockDetails, freshUnlockIds);
  }

  function syncUnlockState(elements, unlocks) {
    var unlockValue = unlocks.join(" ");

    if (unlockValue) {
      elements.tank.dataset.unlocks = unlockValue;
      elements.pet.dataset.unlocks = unlockValue;
      return;
    }

    delete elements.tank.dataset.unlocks;
    delete elements.pet.dataset.unlocks;
  }

  function renderUnlockList(listElement, unlockDetails, freshUnlockIds) {
    var freshLookup = freshUnlockIds.reduce(function (lookup, unlockId) {
      lookup[unlockId] = true;
      return lookup;
    }, {});

    if (!listElement) {
      return;
    }

    while (listElement.firstChild) {
      listElement.removeChild(listElement.firstChild);
    }

    if (!unlockDetails.length) {
      listElement.appendChild(createUnlockEmptyState());
      return;
    }

    unlockDetails.forEach(function (unlock) {
      listElement.appendChild(createUnlockCard(unlock, freshLookup[unlock.id]));
    });
  }

  function createUnlockEmptyState() {
    var emptyCard = document.createElement("article");
    var title = document.createElement("strong");
    var description = document.createElement("p");

    emptyCard.className = "unlock-card unlock-card--empty";
    title.className = "unlock-card__title";
    title.textContent = "Tiny surprises are waiting.";
    description.className = "unlock-card__description";
    description.textContent = "Care for Tamalotl to collect cozy little unlocks.";

    emptyCard.appendChild(title);
    emptyCard.appendChild(description);

    return emptyCard;
  }

  function createUnlockCard(unlock, isFresh) {
    var card = document.createElement("article");
    var top = document.createElement("div");
    var levelLabel = document.createElement("span");
    var title = document.createElement("strong");
    var description = document.createElement("p");

    card.className = "unlock-card";

    if (isFresh) {
      card.dataset.fresh = "true";
    }

    top.className = "unlock-card__top";
    levelLabel.className = "unlock-card__level";
    levelLabel.textContent = "Lv " + unlock.level;
    title.className = "unlock-card__title";
    title.textContent = unlock.title;
    description.className = "unlock-card__description";
    description.textContent = unlock.description;

    top.appendChild(levelLabel);
    top.appendChild(title);
    card.appendChild(top);
    card.appendChild(description);

    return card;
  }

  function activeActionButton(buttons, actionName) {
    buttons.forEach(function (button) {
      if (button.dataset.action === actionName) {
        button.dataset.active = "true";
      } else {
        delete button.dataset.active;
      }
    });
  }

  function clearActionButtons(buttons) {
    buttons.forEach(function (button) {
      delete button.dataset.active;
    });
  }

  function clearActionEffect(elements, timeoutId) {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    delete elements.tank.dataset.effect;
    delete elements.pet.dataset.effect;
    delete elements.body.dataset.sceneEffect;

    clearActionButtons(elements.buttons);
  }

  function randomBetween(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }

  Tamalotl.UI = {
    createUI: createUI,
  };
})();
