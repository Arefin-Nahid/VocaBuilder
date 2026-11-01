/* Text-to-speech.
   speak(text, key) toggles: the first call plays, calling it again with the same key while it plays stops it.
   Every change fires a "vb:speech" event ({detail:{key}} = what is playing now, or null) so buttons can show a playing state. */
(function () {
  "use strict";
  var VB = window.VB;
  var supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  var current = null; // { u: utterance, key: string } while playing

  function announce() {
    document.dispatchEvent(new CustomEvent("vb:speech", { detail: { key: current ? current.key : null } }));
  }

  function stop() {
    if (!supported) return;
    try { speechSynthesis.cancel(); } catch (e) {}
    if (current) { current = null; announce(); }
  }

  function speak(text, key) {
    if (!supported) return;
    key = key || text;
    try {
      var same = current && current.key === key;
      speechSynthesis.cancel();
      if (same) { current = null; announce(); return; } // second tap = stop
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.9;
      var me = { u: u, key: key };
      // Ignore end/error events from an utterance that was already replaced or cancelled.
      u.onend = u.onerror = function () { if (current === me) { current = null; announce(); } };
      current = me;
      announce();
      speechSynthesis.speak(u);
    } catch (e) { current = null; announce(); }
  }

  // Re-send the current state (used after the screen is redrawn).
  function refresh() { announce(); }

  VB.speech = { supported: supported, speak: speak, stop: stop, refresh: refresh };
})();
