/* Progress saved in the browser (localStorage). Every access is wrapped, because storage can be blocked. */
(function () {
  "use strict";
  var VB = window.VB, cfg = VB.config;

  var S = { done: {}, srs: {}, bnStory: false, bnWords: false, bnFull: false, quiz: {}, active: {} };

  function load() {
    try {
      var raw = localStorage.getItem(cfg.storageKey);
      if (raw) {
        var o = JSON.parse(raw);
        for (var k in o) S[k] = o[k];
      } else {
        var old = localStorage.getItem(cfg.legacyKey);
        if (old) S.done = JSON.parse(old) || {};
      }
    } catch (e) {}
  }
  function save() { try { localStorage.setItem(cfg.storageKey, JSON.stringify(S)); } catch (e) {} }

  VB.store = { S: S, load: load, save: save };
})();
