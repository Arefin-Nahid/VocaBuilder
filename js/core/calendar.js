/* Today's date (used only to schedule spaced reviews and count streaks; lessons are not tied to dates). */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils;
  VB.calendar = { today: u.iso(new Date()) };
})();
