/* Text-to-speech. Calling speak() with the same text while it is playing stops it (play / stop toggle). */
(function () {
  "use strict";
  var VB = window.VB;
  var supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  var playingText = null;

  function speak(text) {
    if (!supported) return;
    try {
      var same = playingText === text && (speechSynthesis.speaking || speechSynthesis.pending);
      speechSynthesis.cancel();
      if (same) { playingText = null; return; }
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.9;
      playingText = text;
      u.onend = u.onerror = function () { if (playingText === text) playingText = null; };
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  VB.speech = { supported: supported, speak: speak };
})();
