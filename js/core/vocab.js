/* Turns the raw data files into lookups: entries per day, all words, and a stem matcher for highlighted story words. */
(function () {
  "use strict";
  var VB = window.VB;

  var DAYS = (window.DAYS || []).slice().sort(function (a, b) { return a.n - b.n; });
  var BN = window.BN || {}; // Bangla meaning per headword (lowercase)
  var BT = window.BT || {}; // Bangla translation per day's story
  var EX = window.EX || {}; // example sentence per word ("word" or "word|pos"); *starred* text is the word
  var ENT = {}, ALL = {};

  // A data row is "Word|pos|English meaning". Duplicates inside one day are skipped.
  DAYS.forEach(function (d) {
    ENT[d.n] = [];
    var seen = {};
    d.g.forEach(function (g, gi) {
      g[1].forEach(function (r) {
        var p = r.split("|"), k = p[0].toLowerCase();
        if (seen[k]) return;
        seen[k] = 1;
        var e = { k: k, w: p[0], pos: p[1], m: p[2], day: d.n, gi: gi };
        ENT[d.n].push(e);
        if (!ALL[k]) ALL[k] = e;
      });
    });
  });

  function parts(w) { return w.toLowerCase().split(/[\/ ]+/).filter(Boolean); }

  // Find the vocabulary entry for a highlighted story word (exact match first, then a shared stem).
  function findEntry(day, u) {
    var L = ENT[day], i, j;
    for (i = 0; i < L.length; i++) { if (L[i].k === u || parts(L[i].k).indexOf(u) > -1) return L[i]; }
    for (i = 0; i < L.length; i++) {
      var ps = parts(L[i].k);
      for (j = 0; j < ps.length; j++) {
        var p = ps[j];
        if (p.length >= 4 && u.indexOf(p.slice(0, Math.max(4, p.length - 3))) === 0) return L[i];
      }
    }
    // Short words that double their last letter: don -> donned, donning.
    for (i = 0; i < L.length; i++) {
      var q = parts(L[i].k)[0] || "";
      if (q.length === 3 && (u === q + q.slice(-1) + "ed" || u === q + q.slice(-1) + "ing")) return L[i];
    }
    return null;
  }

  function dayKeys(n) { return ENT[n].map(function (e) { return e.k; }); }

  // Example sentence for an entry (a "word|pos" key wins over a plain "word" key).
  function example(e) { return EX[e.k + "|" + e.pos] || EX[e.k] || ""; }

  VB.vocab = { DAYS: DAYS, BN: BN, BT: BT, EX: EX, example: example, ENT: ENT, ALL: ALL, findEntry: findEntry, dayKeys: dayKeys };
})();
