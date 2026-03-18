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
