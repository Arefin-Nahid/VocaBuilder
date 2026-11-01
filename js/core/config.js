/* Global namespace, constants and the shared view state. Loaded first. */
(function () {
  "use strict";
  var VB = (window.VB = window.VB || {});

  VB.config = {
    storageKey: "vb30-v2",
    legacyKey: "vb30-done",
    startDate: new Date(2026, 10, 1), // Day 1 = 1 November 2026
    totalDays: 30,
    intervals: [1, 2, 4, 8, 16], // Leitner box gaps, in days
    quizSize: 10,
    reviewSize: 20
  };

  // Which screen is open. Changed by the router and the UI modules.
  VB.state = { view: "learn", cur: 1, Q: null, R: null };
  VB.ui = {};
})();
