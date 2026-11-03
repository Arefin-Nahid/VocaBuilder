/* Sticky lesson bar (head word of the current page, tap it to open the Index) and the tabs. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, S = VB.store.S;

  function render() {
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
