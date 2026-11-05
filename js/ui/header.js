/* Sticky lesson bar (head word of the current page, tap it to open the Index) and the tabs. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, S = VB.store.S;

  // One word per calendar day, the same on every device (picked from the sorted word list by the date).
  function wordOfDay() {
    var ALL = VB.vocab.ALL, keys = Object.keys(ALL).filter(function (k) { return /^[a-z]{5,12}$/.test(k); }).sort();
    var d = new Date(), n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
    var k = keys[(n * 7919) % keys.length];
    return k ? ALL[k] : null;
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
