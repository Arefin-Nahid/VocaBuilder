/* Progress by lesson, not by calendar: which day is up next, what is finished, and the study streak. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, S = VB.store.S, V = VB.vocab;

  function finishedDays() { return V.nums.filter(function (n) { return S.done[n]; }); }

  // The earliest day that is not finished yet (so a skipped day comes back first). If all are finished, the last day.
  function upNext() {
    for (var i = 0; i < V.nums.length; i++) { if (!S.done[V.nums[i]]) return V.nums[i]; }
    return V.nums[V.nums.length - 1];
  }
  function wordsLearned() {
    var c = 0;
    finishedDays().forEach(function (n) { c += V.ENT[n].length; });
    return c;
  }
  // Mark today as a study day (finishing a day, answering a quiz question or rating a review card).
  function touch() {
    var t = VB.calendar.today;
    if (!S.active) S.active = {};
    if (!S.active[t]) { S.active[t] = 1; VB.store.save(); }
  }
  // Consecutive study days ending today (or yesterday, so the streak is not lost before you study today).
  function streak() {
    var a = S.active || {}, d = VB.calendar.today, n = 0;
    if (!a[d]) d = u.addDays(d, -1);
    while (a[d]) { n++; d = u.addDays(d, -1); }
    return n;
  }

  VB.progress = { finishedDays: finishedDays, upNext: upNext, wordsLearned: wordsLearned, touch: touch, streak: streak };
})();
