/* Index screen: every headword A-Z, with search, a finished/not-finished filter and the days it appears on. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, esc = u.esc, S = VB.store.S, BN = VB.vocab.BN;

  var ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  var q = "", filter = "all"; // kept while you move between screens

  function matches(it) {
    var e = it.e;
    if (filter !== "all") {
      var fin = it.days.some(function (n) { return S.done[n]; });
      if ((filter === "done") !== fin) return false;
    }
    if (!q) return true;
    var hay = (e.k + " " + e.m + " " + (BN[e.k] || "")).toLowerCase();
    return hay.indexOf(q) > -1;
  }

  function listHTML() {
    var items = VB.vocab.index().filter(matches);
    if (!items.length) return '<div class="card empty"><p style="margin:0">No words match.</p></div>';
    var h = "", letter = "", bn = S.bnIndex !== false;
    items.forEach(function (it) {
      var e = it.e, L = e.k.charAt(0).toUpperCase();
      if (L !== letter) { if (letter) h += "</ul></section>"; letter = L; h += '<section class="ixl"><h3 class="ixh">' + L + "</h3><ul>"; }
      h += '<li class="ixw"><div class="ixtop"><span class="w">' + esc(e.w) + '</span><span class="pos pos-' + e.pos + '">' + e.pos + "</span>"
        + (VB.speech.supported ? '<button class="spk" data-act="sayword" data-w="' + esc(e.w.split("/")[0]) + '" aria-label="Listen to ' + esc(e.w) + '" title="Listen">' + ICON + "</button>" : "")
        + '<span class="ixd">' + it.days.map(function (n) { return '<button class="dchip' + (S.done[n] ? " fin" : "") + '" data-act="ixopen" data-n="' + n + '" data-w="' + esc(e.k) + '" aria-label="Open day ' + n + '">Day ' + n + "</button>"; }).join("") + "</span></div>"
        + '<div class="m">' + esc(e.m) + "</div>" + (bn && BN[e.k] ? '<div class="eb ixb" lang="bn">' + esc(BN[e.k]) + "</div>" : "") + "</li>";
    });
    return h + "</ul></section>";
  }

  function count(n) { return n + (n === 1 ? " word" : " words"); }

  function update() {
    var box = $("ixlist");
    if (!box) return;
    box.innerHTML = listHTML();
    $("ixcount").textContent = count(box.querySelectorAll(".ixw").length);
    VB.speech.refresh();
  }

  function render() {
    var bn = S.bnIndex !== false;
    var h = '<div><div class="when">All words, A to Z</div><h1>Index</h1></div>'
      + '<div class="ixbar"><input id="ixq" type="search" placeholder="Search a word or meaning" value="' + esc(q) + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search the index">'
      + '<div class="tools"><button class="btn sw" data-act="ixf" data-f="all" aria-pressed="' + (filter === "all") + '">All</button>'
      + '<button class="btn sw" data-act="ixf" data-f="done" aria-pressed="' + (filter === "done") + '">Finished days</button>'
      + '<button class="btn sw" data-act="ixf" data-f="todo" aria-pressed="' + (filter === "todo") + '">Not finished</button>'
      + '<button class="btn sw" data-act="ixbn" aria-pressed="' + bn + '"><span class="bn-lbl">বাংলা অর্থ</span></button>'
      + '<span class="ixcount" id="ixcount"></span></div></div><div id="ixlist"></div>';
    $("view").innerHTML = h;
    update();
  }

  function setQuery(v) { q = v.trim().toLowerCase(); update(); }
  function setFilter(f) { filter = f; render(); }
  function toggleBn() { S.bnIndex = S.bnIndex === false; VB.store.save(); render(); }

  VB.ui.index = { render: render, setQuery: setQuery, setFilter: setFilter, toggleBn: toggleBn };
})();
