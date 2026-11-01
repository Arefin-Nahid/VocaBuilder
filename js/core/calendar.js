/* Which day of the 30-day plan is today. */
(function () {
  "use strict";
  var VB = window.VB, cfg = VB.config, u = VB.utils;

  var now = new Date();
  var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var rawToday = Math.round((midnight - cfg.startDate) / 864e5) + 1; // can be < 1 before the start date

  VB.calendar = {
    today: u.iso(now),
    rawToday: rawToday,
    todayN: Math.min(cfg.totalDays, Math.max(1, rawToday)),
    dayLabel: function (n) {
      return new Date(cfg.startDate.getFullYear(), cfg.startDate.getMonth(), n)
        .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    }
  };
})();
