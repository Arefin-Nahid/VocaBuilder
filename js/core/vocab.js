/* Merges every data pack (window.VB_PACKS) into lookups: days, entries per day, all words, the A-Z index and a stem matcher. */
(function () {
  "use strict";
  var VB = window.VB;

  var BN = {}, BT = {}, EX = {}, BYN = {}; // Bangla meanings, Bangla story translations, example sentences, days by number
  (window.VB_PACKS || []).forEach(function (p) {
    (p.days || []).forEach(function (d) { BYN[d.n] = d; }); // a later pack replaces an earlier one with the same day number
    var k;
    for (k in (p.bn || {})) BN[k] = p.bn[k];
    for (k in (p.bt || {})) BT[k] = p.bt[k];
    for (k in (p.ex || {})) EX[k] = p.ex[k];
  });
  var NUMS = Object.keys(BYN).map(Number).sort(function (a, b) { return a - b; });
  var DAYS = NUMS.map(function (n) { return BYN[n]; });
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
    var L = ENT[day] || [], i, j;
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

  function dayKeys(n) { return (ENT[n] || []).map(function (e) { return e.k; }); }
  function has(n) { return !!BYN[n]; }
  function day(n) { return BYN[n]; }
  // The next (dir = 1) or previous (dir = -1) day that exists, or 0.
  function neighbor(n, dir) {
    var i, c = 0;
    if (dir > 0) { for (i = 0; i < NUMS.length; i++) { if (NUMS[i] > n) return NUMS[i]; } }
    else { for (i = NUMS.length - 1; i >= 0; i--) { if (NUMS[i] < n) return NUMS[i]; } }
    return c;
  }

  // Example sentence for an entry (a "word|pos" key wins over a plain "word" key).
  function example(e) { return EX[e.k + "|" + e.pos] || EX[e.k] || ""; }

  // Every headword A-Z with the days it appears on (built once, on first use).
  var IDX = null;
  function index() {
    if (IDX) return IDX;
    var map = {};
    DAYS.forEach(function (d) {
      ENT[d.n].forEach(function (e) {
        if (!map[e.k]) map[e.k] = { e: e, days: [] };
        map[e.k].days.push(d.n);
      });
    });
    IDX = Object.keys(map).sort(function (a, b) { return a.localeCompare(b, "en"); }).map(function (k) { return map[k]; });
    return IDX;
  }

  VB.vocab = {
    DAYS: DAYS, nums: NUMS, BN: BN, BT: BT, EX: EX, ENT: ENT, ALL: ALL,
    has: has, day: day, neighbor: neighbor, index: index,
    example: example, findEntry: findEntry, dayKeys: dayKeys
  };
})();
