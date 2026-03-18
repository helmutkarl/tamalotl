(function () {
  var Tamalotl = (window.Tamalotl = window.Tamalotl || {});
  var CONFIG = Tamalotl.CONFIG;
  var Game = Tamalotl.Game;
  var Storage = Tamalotl.Storage;
  var UI = Tamalotl.UI;

  document.addEventListener("DOMContentLoaded", function () {
    var ui = UI.createUI();
    var now = Date.now();
    // Apply elapsed time immediately so a reload still feels alive.
    var state = Game.tick(Game.normalizeState(Storage.loadState(), now), now);

    function renderAndSave() {
      ui.render(state);
      Storage.saveState(state);
    }

    function refreshFromTime() {
      state = Game.tick(state, Date.now());
      renderAndSave();
    }

    ui.bindActions(function (actionName) {
      ui.playActionEffect(actionName);
      state = Game.applyAction(state, actionName, Date.now());
      renderAndSave();
    });

    ui.bindPetInteraction(function () {
      ui.playActionEffect("pet");
      state = Game.applyAction(state, "pet", Date.now());
      renderAndSave();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        Storage.saveState(state);
        return;
      }

      refreshFromTime();
    });

    window.addEventListener("beforeunload", function () {
      Storage.saveState(state);
    });

    renderAndSave();
    ui.startAmbientMotion();
    window.setInterval(refreshFromTime, CONFIG.tickMs);
  });
})();
