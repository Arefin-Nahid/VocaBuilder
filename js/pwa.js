/* Registers the service worker (install-to-home-screen + offline). Skipped when opened from disk (file://). */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
})();
