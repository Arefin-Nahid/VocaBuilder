/* Small helpers with no knowledge of the app. */
(function () {
  "use strict";
  var VB = window.VB;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function addDays(s, n) { var p = s.split("-"); return iso(new Date(+p[0], +p[1] - 1, +p[2] + n)); }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function first(s) { return String(s || "").split(";")[0].trim(); }
  function fmtDate(s) {
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }

  VB.utils = { $: $, esc: esc, pad: pad, iso: iso, addDays: addDays, shuffle: shuffle, first: first, fmtDate: fmtDate };
})();
