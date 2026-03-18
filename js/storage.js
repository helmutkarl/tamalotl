(function () {
  var Tamalotl = (window.Tamalotl = window.Tamalotl || {});
  var CONFIG = Tamalotl.CONFIG;

  function loadState() {
    try {
      var rawValue = window.localStorage.getItem(CONFIG.storageKey);

      if (!rawValue) {
        return null;
      }

      return JSON.parse(rawValue);
    } catch (error) {
      console.warn("Could not load Tamalotl save data.", error);
      return null;
    }
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn("Could not save Tamalotl state.", error);
    }
  }

  Tamalotl.Storage = {
    loadState: loadState,
    saveState: saveState,
  };
})();
