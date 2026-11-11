/* Sticky lesson bar (head word of the current page, tap it to open the Index) and the tabs. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, S = VB.store.S;

  // One word per calendar day, the same on every device (picked from the sorted word list by the date).
  // Word of the day: a new word each day, taken from the chapters you have finished.
  // Before any chapter is finished it comes from the page you are on.
  function wordOfDay() {
    var ALL = VB.vocab.ALL, done = S.done || {}, d = new Date();
    var today = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    var pool = Object.keys(ALL).filter(function (k) { return done[ALL[k].day] && /^[a-z]{4,14}$/.test(k); }).sort();
    if (!pool.length) pool = Object.keys(ALL).filter(function (k) { return ALL[k].day === VB.state.cur && /^[a-z]{4,14}$/.test(k); }).sort();
    if (!pool.length) return null;
    try {
      var st = JSON.parse(localStorage.getItem("vb-wod") || "null");
      if (st && st.d === today && ALL[st.k] && pool.indexOf(st.k) > -1) return ALL[st.k];
    } catch (e) {}
    var n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
    var k = pool[(n * 7919) % pool.length];
    try { localStorage.setItem("vb-wod", JSON.stringify({ d: today, k: k })); } catch (e) {}
    return ALL[k];
  }

  function brand() {
    var d = new Date(), el = $("bdate"), w = $("bword"), wd = $("wd"), e = wordOfDay();
    if (el) el.innerHTML = '<span class="dw">' + d.toLocaleDateString("en-US", { weekday: "long" }) + '</span><span class="dc">, </span><span class="dm">' + d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + "</span>";
    if (e && w && wd) {
      w.dataset.n = e.day; w.dataset.w = e.k;
      wd.innerHTML = '<span class="l1">Word of the day</span><span class="l2">Today</span> <i>·</i> <em>' + u.esc(e.w) + "</em>";
    }
  }

  function render() {
    brand();
    var st = VB.state, V = VB.vocab, P = VB.progress, up = P.upNext();
    var head = V.headOf(st.cur), part = V.partLabel(st.cur);
    $("dn").textContent = head.title;
    $("dd").textContent = [part, S.done[st.cur] ? "Finished" : (st.cur === up ? "Up next" : "")].filter(Boolean).join(" · ") || "Tap for the index";
    $("prev").disabled = !V.neighbor(st.cur, -1);
    $("next").disabled = !V.neighbor(st.cur, 1);

    var tabs = document.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute("aria-selected", tabs[i].dataset.tab === st.view);
    var due = VB.srs.dueKeys().length;
    $("badge").textContent = due ? due : "";
  }

  VB.ui.header = { render: render };
})();
