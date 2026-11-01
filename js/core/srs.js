/* Spaced repetition (Leitner boxes). A word moves up a box when remembered and back to box 1 when forgotten. */
(function () {
  "use strict";
  var VB = window.VB, cfg = VB.config, S = VB.store.S, u = VB.utils;

  function ensure(keys) {
    var changed = false;
    keys.forEach(function (k) {
      if (!S.srs[k]) { S.srs[k] = { b: 1, d: u.addDays(VB.calendar.today, 1) }; changed = true; }
    });
    if (changed) VB.store.save();
  }

  function grade(k, res) {
    var today = VB.calendar.today, s = S.srs[k] || { b: 1, d: today };
    if (res === "good") { s.b = Math.min(5, s.b + 1); s.d = u.addDays(today, cfg.intervals[s.b - 1]); }
    else if (res === "hard") { s.d = u.addDays(today, Math.max(1, Math.floor(cfg.intervals[s.b - 1] / 2))); }
    else { s.b = 1; s.d = u.addDays(today, 1); }
    S.srs[k] = s;
  }

  function dueKeys() {
    var out = [];
    for (var k in S.srs) { if (S.srs[k].d <= VB.calendar.today && VB.vocab.ALL[k]) out.push(k); }
    return out;
  }

  VB.srs = { ensure: ensure, grade: grade, dueKeys: dueKeys };
})();
