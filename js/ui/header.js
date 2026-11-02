/* Sticky day bar, tabs and the "all days" picker. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, S = VB.store.S;

  function render() {
    var st = VB.state, V = VB.vocab, P = VB.progress, up = P.upNext();
    $("dn").textContent = "Day " + st.cur;
    $("dd").textContent = V.day(st.cur).t;
    $("prev").disabled = !V.neighbor(st.cur, -1);
    $("next").disabled = !V.neighbor(st.cur, 1);

    var tabs = document.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute("aria-selected", tabs[i].dataset.tab === st.view);
    var due = VB.srs.dueKeys().length;
    $("badge").textContent = due ? due : "";

    var h = "";
    V.nums.forEach(function (n) {
      var c = "cell" + (S.done[n] ? " done" : "") + (n === st.cur ? " cur" : "") + (n === up && !S.done[n] ? " next" : "");
      h += '<button class="' + c + '" data-act="day" data-n="' + n + '" aria-label="Day ' + n + (S.done[n] ? ", finished" : "") + (n === up && !S.done[n] ? ", up next" : "") + '">' + n + "</button>";
    });
    $("strip").innerHTML = h;

    var inReview = 0, known = 0, k, streak = P.streak();
    for (k in S.srs) { inReview++; if (S.srs[k].b >= 5) known++; }
    $("stats").innerHTML = "<span><b>" + P.finishedDays().length + "</b> days finished</span><span><b>" + P.wordsLearned() + "</b> words learned</span><span><b>" + inReview + "</b> in review</span><span><b>" + known + "</b> well known</span>"
      + (streak ? "<span><b>" + streak + "</b> day streak</span>" : "");
  }

  VB.ui.header = { render: render };
})();
