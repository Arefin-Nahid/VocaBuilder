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
    // Fixed gaps: Forgot = tomorrow, Hard = 3 days, Got it = 7 days.
    if (res === "good") { s.b = Math.min(5, s.b + 1); s.d = u.addDays(today, cfg.gaps.good); }
    else if (res === "hard") { s.d = u.addDays(today, cfg.gaps.hard); }
    else { s.b = 1; s.d = u.addDays(today, cfg.gaps.again); }
    s.r = res; // last rating, used by the Review screen summary
    S.srs[k] = s;
  }

  function dueKeys() {
    var out = [];
    for (var k in S.srs) { if (S.srs[k].d <= VB.calendar.today && VB.vocab.ALL[k]) out.push(k); }
    return out;
  }

  VB.srs = { ensure: ensure, grade: grade, dueKeys: dueKeys };
})();
