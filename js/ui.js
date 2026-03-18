(function () {
  var Tamalotl = (window.Tamalotl = window.Tamalotl || {});
  var CONFIG = Tamalotl.CONFIG;

  function createUI() {
    var elements = {
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

    return {
      bindActions: function (onAction) {
        elements.buttons.forEach(function (button) {
          button.addEventListener("click", function () {
            onAction(button.dataset.action);
          });
        });
      },

      render: function (state) {
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

  Tamalotl.UI = {
    createUI: createUI,
  };
})();
