/* Index screen: the head words of the book (e.g. "Flattery", "Food"), each linking to its pages.
   Search also finds any word inside the pages. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, esc = u.esc, S = VB.store.S, V = VB.vocab, BN = V.BN;

  var ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  var q = "", filter = "all"; // kept while you move between screens

  function state(h) {
    var n = h.pages.filter(function (p) { return S.done[p]; }).length;
    return n === h.pages.length ? "done" : n ? "part" : "todo";
  }

  function headRow(h, up) {
    var st = state(h), here = h.pages.indexOf(up) > -1 && st !== "done";
    var h2 = '<li class="ixw head ' + st + '"><div class="ixtop"><button class="ixt" data-act="ixopen" data-n="' + h.n + '">' + esc(h.title) + "</button>"
      + (here ? '<span class="tag">Up next</span>' : "") + '<span class="mark" aria-label="' + (st === "done" ? "Finished" : st === "part" ? "Partly finished" : "Not finished") + '"></span></div>';
    if (h.pages.length > 1) {
      h2 += '<div class="ixd">' + h.pages.map(function (p, i) {
        return '<button class="dchip' + (S.done[p] ? " fin" : "") + '" data-act="ixopen" data-n="' + p + '" aria-label="' + esc(h.title) + ", part " + (i + 1) + '">' + (i + 1) + "</button>";
      }).join("") + "</div>";
    }
    return h2 + "</li>";
  }

  function headsHTML() {
    var up = VB.progress.upNext();
    var list = V.heads.filter(function (h) {
      if (filter !== "all" && (filter === "done") !== (state(h) === "done")) return false;
      return !q || h.title.toLowerCase().indexOf(q) > -1;
    });
    list = list.slice().sort(function (a, b) { return a.title.localeCompare(b.title, "en"); });
    if (!list.length) return q ? "" : '<div class="card empty"><p style="margin:0">Nothing here yet.</p></div>';
    var h = "", letter = "";
    list.forEach(function (x) {
      var L = x.title.charAt(0).toUpperCase();
      if (L !== letter) { if (letter) h += "</ul></section>"; letter = L; h += '<section class="ixl"><h3 class="ixh">' + L + '</h3><ul class="ixul">'; }
      h += headRow(x, up);
    });
    return h + "</ul></section>";
  }

  // Words inside the pages that match the search box (shown only while searching).
  function wordsHTML() {
    if (!q) return "";
    var items = V.index().filter(function (it) {
      return (it.e.k + " " + it.e.m + " " + (BN[it.e.k] || "")).toLowerCase().indexOf(q) > -1;
    });
    if (!items.length) return "";
    var more = items.length > 40;
    items = items.slice(0, 40);
    var h = '<section class="ixl"><h3 class="ixh">Words</h3><ul class="ixul">';
    items.forEach(function (it) {
      var e = it.e;
      h += '<li class="ixw"><div class="ixtop"><span class="w">' + esc(e.w) + '</span><span class="pos pos-' + e.pos + '">' + e.pos + "</span>"
        + (VB.speech.supported ? '<button class="spk" data-act="sayword" data-w="' + esc(e.w.split("/")[0]) + '" aria-label="Listen to ' + esc(e.w) + '" title="Listen">' + ICON + "</button>" : "")
        + '<span class="ixd">' + it.days.map(function (n) { return '<button class="dchip wide' + (S.done[n] ? " fin" : "") + '" data-act="ixopen" data-n="' + n + '" data-w="' + esc(e.k) + '">' + esc(V.headOf(n).title) + "</button>"; }).join("") + "</span></div>"
        + '<div class="m">' + esc(e.m) + "</div>" + (BN[e.k] ? '<div class="eb ixb" lang="bn">' + esc(BN[e.k]) + "</div>" : "") + "</li>";
    });
    return h + "</ul>" + (more ? '<p class="note">Showing the first 40. Type more letters to narrow it down.</p>' : "") + "</section>";
  }

  function update() {
    var box = $("ixlist");
    if (!box) return;
    var heads = headsHTML(), words = wordsHTML();
    box.innerHTML = heads + words || '<div class="card empty"><p style="margin:0">No match.</p></div>';
    VB.speech.refresh();
  }

  function statsHTML() {
    var P = VB.progress, streak = P.streak();
    return "<span><b>" + P.finishedDays().length + "</b> pages finished</span><span><b>" + P.wordsLearned() + "</b> words learned</span>" + (streak ? "<span><b>" + streak + "</b> day streak</span>" : "");
  }

  function render() {
    var h = '<div><div class="when">Head words, A to Z</div><h1>Index</h1></div>'
      + '<div class="legend ixstats">' + statsHTML() + "</div>"
      + '<div class="ixbar"><input id="ixq" type="search" placeholder="Search a head word or any word" value="' + esc(q) + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search the index">'
      + '<div class="tools"><button class="btn sw" data-act="ixf" data-f="all" aria-pressed="' + (filter === "all") + '">All</button>'
      + '<button class="btn sw" data-act="ixf" data-f="done" aria-pressed="' + (filter === "done") + '">Finished</button>'
      + '<button class="btn sw" data-act="ixf" data-f="todo" aria-pressed="' + (filter === "todo") + '">Not finished</button></div></div><div id="ixlist"></div>';
    $("view").innerHTML = h;
    update();
  }

  function setQuery(v) { q = v.trim().toLowerCase(); update(); }
  function setFilter(f) { filter = f; render(); }

  VB.ui.index = { render: render, setQuery: setQuery, setFilter: setFilter };
})();
