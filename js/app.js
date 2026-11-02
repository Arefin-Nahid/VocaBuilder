/* Router, event handling and start-up. Loaded last. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, S = VB.store.S, st = VB.state, cfg = VB.config;

  /* ----- routing: #day-N, #day-N-quiz, #review ----- */
  function setHash() {
    var h = st.view === "review" ? "#review" : (st.view === "quiz" ? "#day-" + st.cur + "-quiz" : "#day-" + st.cur);
    try { history.replaceState(null, "", h); } catch (e) { try { location.hash = h.slice(1); } catch (e2) {} }
  }
  function fromHash() {
    var h = location.hash, m;
    var clamp = function (n) { return Math.min(cfg.totalDays, Math.max(1, +n)); };
    if (h === "#review") { st.view = "review"; return true; }
    if ((m = /^#day-(\d+)-quiz$/.exec(h))) { st.cur = clamp(m[1]); st.view = "quiz"; return true; }
    if ((m = /^#day-(\d+)$/.exec(h))) { st.cur = clamp(m[1]); st.view = "learn"; return true; }
    return false;
  }

  function render() {
    VB.ui.header.render();
    if (st.view === "learn") VB.ui.learn.render();
    else if (st.view === "quiz") VB.ui.quiz.render();
    else VB.ui.review.render();
    VB.speech.refresh(); // keep the playing highlight after a redraw
  }
  VB.render = render;

  function go(n, view) {
    st.cur = Math.min(cfg.totalDays, Math.max(1, n));
    if (view) st.view = view;
    if (st.Q && st.Q.day !== st.cur) st.Q = null;
    VB.speech.stop();
    $("days").hidden = true;
    $("daybtn").setAttribute("aria-expanded", "false");
    setHash(); render(); window.scrollTo(0, 0);
  }
  function openView(v) { VB.speech.stop(); st.view = v; $("days").hidden = true; setHash(); render(); window.scrollTo(0, 0); }

  /* ----- click actions: data-act="name" on any element ----- */
  var L = VB.ui.learn, Qz = VB.ui.quiz, Rv = VB.ui.review;
  var actions = {
    tab: function (a) { if (a.dataset.tab === "review") st.R = null; openView(a.dataset.tab); },
    day: function (a) { go(+a.dataset.n, st.view === "review" ? "learn" : st.view); },
    prev: function () { go(st.cur - 1); },
    next: function () { go(st.cur + 1, st.view); },
    nextDay: function () { go(st.cur + 1, "learn"); },
    days: function (a) { var open = $("days").hidden; $("days").hidden = !open; a.setAttribute("aria-expanded", open); },
    bnStory: L.toggleStoryBn,
    bnFull: L.toggleFullBn,
    bnWords: L.toggleWordsBn,
    exAll: L.toggleEx,
    recall: L.toggleRecall,
    reveal: L.revealAll,
    hear: L.hearStory,
    sayword: function (a) { VB.speech.speak(a.dataset.w, "word:" + a.dataset.w); },
    hl: function (a) { L.highlight(a.dataset.w); },
    done: function () {
      if (S.done[st.cur]) delete S.done[st.cur];
      else { S.done[st.cur] = 1; VB.srs.ensure(VB.vocab.dayKeys(st.cur)); }
      VB.store.save(); render();
    },
    gotoQuiz: function () { VB.speech.stop(); st.view = "quiz"; st.Q = null; setHash(); render(); window.scrollTo(0, 0); },
    startQuiz: Qz.start,
    ans: function (a) { Qz.answer(+a.dataset.i); },
    nextQ: Qz.next,
    startReview: Rv.start,
    flip: Rv.flip,
    rate: function (a) { Rv.rate(a.dataset.r); },
    endReview: Rv.end
  };

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    var a = t.closest && t.closest("[data-act]");
    if (a) {
      var fn = actions[a.dataset.act];
      if (fn) fn(a);
      return;
    }
    // Recall mode: tapping a blurred word card reveals it.
    var e = t.closest && t.closest(".e");
    if (e) e.classList.add("shown");
  });
  document.addEventListener("keydown", function (ev) {
    if ((ev.key === "Enter" || ev.key === " ") && ev.target.classList && ev.target.classList.contains("e")) {
      ev.preventDefault();
      ev.target.classList.add("shown");
    }
  });
  // Highlight the listen button that is playing; everything returns to normal when it stops.
  document.addEventListener("vb:speech", function (ev) {
    var playing = ev.detail.key, btns = document.querySelectorAll('[data-act="hear"],[data-act="sayword"]');
    for (var i = 0; i < btns.length; i++) {
      var key = btns[i].dataset.act === "hear" ? "story" : "word:" + btns[i].dataset.w;
      var on = playing !== null && key === playing;
      btns[i].classList.toggle("playing", on);
      btns[i].setAttribute("aria-pressed", on);
    }
  });
  window.addEventListener("hashchange", function () { if (fromHash()) { render(); window.scrollTo(0, 0); } });

  /* ----- start-up ----- */
  VB.store.load();
  st.cur = VB.calendar.todayN;
  if (!fromHash()) st.view = VB.srs.dueKeys().length ? "review" : "learn";
  render();
})();
