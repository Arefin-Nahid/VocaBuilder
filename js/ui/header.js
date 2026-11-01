/* Sticky day bar, tabs and the "all days" picker. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, S = VB.store.S;

  function render() {
    var st = VB.state, cal = VB.calendar, total = VB.config.totalDays;
    $("dn").textContent = "Day " + st.cur + " of " + total;
    $("dd").textContent = cal.dayLabel(st.cur) + " · " + VB.vocab.DAYS[st.cur - 1].t;
    $("prev").disabled = st.cur === 1;
    $("next").disabled = st.cur === total;

    var tabs = document.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute("aria-selected", tabs[i].dataset.tab === st.view);
    var due = VB.srs.dueKeys().length;
    $("badge").textContent = due ? due : "";

    var h = "";
    VB.vocab.DAYS.forEach(function (d) {
      var c = "cell" + (S.done[d.n] ? " done" : "") + (d.n === st.cur ? " cur" : "") + (d.n === cal.todayN && cal.rawToday >= 1 ? " today" : "");
      h += '<button class="' + c + '" data-act="day" data-n="' + d.n + '" aria-label="Day ' + d.n + ", " + cal.dayLabel(d.n) + (S.done[d.n] ? ", finished" : "") + '">' + d.n + "</button>";
    });
    $("strip").innerHTML = h;

    var finished = 0, inReview = 0, known = 0, k;
    for (k in S.done) { if (S.done[k]) finished++; }
    for (k in S.srs) { inReview++; if (S.srs[k].b >= 5) known++; }
    $("stats").innerHTML = "<span><b>" + finished + "</b> of 30 days finished</span><span><b>" + inReview + "</b> words in review</span><span><b>" + known + "</b> well known</span>";
  }

  VB.ui.header = { render: render };
})();
