/* Learn screen: Context story (with Bangla options), vocabulary groups, recall mode. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, esc = u.esc, S = VB.store.S, BN = VB.vocab.BN, ENT = VB.vocab.ENT;

  var ICON_SPEAKER_SM = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

  // Story text with *starred* words turned into tappable highlights that carry their Bangla meaning.
  function storyHTML(d) {
    return esc(d.s).replace(/\*([^*]+)\*/g, function (m, w) {
      var e = VB.vocab.findEntry(d.n, w.toLowerCase());
      var b = e && BN[e.k] ? u.first(BN[e.k]) : "";
      return '<span class="wb"><button class="hl" data-act="hl" data-w="' + esc(w.toLowerCase()) + '">' + w + '</button><span class="bn">' + esc(b) + "</span></span>";
    });
  }
  function plainStory(d) { return d.s.replace(/\*/g, ""); }

  // Example sentence under a word; the starred word is shown in bold.
  function exHTML(p) {
    var s = VB.vocab.example({ k: p[0].toLowerCase(), pos: p[1] });
    if (!s) return "";
    return '<span class="ex">' + esc(s).replace(/\*([^*]+)\*/g, "<b>$1</b>") + "</span>";
  }

  function render() {
    var st = VB.state, cur = st.cur, d = VB.vocab.day(cur), up = VB.progress.upNext();
    var canSpeak = VB.speech.supported, note = "";
    if (cur === up && !S.done[cur]) note = "This is your next lesson.";
    else if (cur > up && !S.done[cur]) note = "You are reading ahead. Day " + up + " is not finished yet.";
    else if (cur < up && !S.done[cur]) note = "You have not marked this day finished yet.";

    var h = '<div><h1 style="margin-top:0">' + esc(d.t) + "</h1>" + (note ? '<div class="note">' + note + "</div>" : "") + "</div>";

    h += '<section class="card story-card" aria-labelledby="lbl-story"><div class="cardhead"><h2 class="label" id="lbl-story">Context</h2>'
      + '<div class="ctx-tools" role="group" aria-label="Context options">'
      + (canSpeak ? '<button class="spk" data-act="hear" aria-label="Listen to the story" title="Listen">' + ICON_SPEAKER_SM + "</button>" : "")
      + '<button class="chip sw" id="swFull" data-act="bnFull" aria-pressed="' + (!!S.bnFull) + '"><span class="bn-lbl">বাংলা অনুবাদ</span></button>'
      + '<button class="chip sw" id="swStory" data-act="bnStory" aria-pressed="' + (!!S.bnStory) + '"><span class="bn-lbl">বাংলা অর্থ</span></button>'
      + "</div></div>"
      + '<p class="story' + (S.bnStory ? " bn-on" : "") + '" id="story">' + storyHTML(d) + "</p>"
      + '<p class="trans" id="trans" lang="bn"' + (S.bnFull ? "" : " hidden") + ">" + esc(VB.vocab.BT[cur] || "") + "</p>"
      + "</section>";

    h += '<section class="sec" aria-labelledby="lbl-vocab"><h2 class="sech" id="lbl-vocab">Vocabulary <span>' + ENT[cur].length + " words in " + d.g.length + " groups</span></h2>"
      + '<div class="tools"><button class="btn sw" id="swWords" data-act="bnWords" aria-pressed="' + (!!S.bnWords) + '"><span class="dot"></span><span class="bn-lbl">বাংলা অর্থ</span></button>'
      + '<button class="btn sw" id="swEx" data-act="exAll" aria-pressed="' + (S.showEx !== false) + '"><span class="dot"></span>Sentences</button>'
      + '<button class="btn sw" id="swRecall" data-act="recall" aria-pressed="false"><span class="dot"></span>Recall mode</button>'
      + '<button class="btn" id="reveal" data-act="reveal" hidden>Reveal all</button></div>';

    h += '<div id="words" class="groups' + (S.bnWords ? " bnw" : "") + (S.showEx !== false ? " showex" : "") + '" aria-label="Word meanings">';
    d.g.forEach(function (g, gi) {
      h += '<div class="group" data-gi="' + gi + '"><h3 class="gt">' + esc(g[0]) + "</h3><ul>";
      g[1].forEach(function (r, ri) {
        var p = r.split("|"), k = p[0].toLowerCase();
        h += '<li class="e" id="e-' + gi + "-" + ri + '" data-k="' + esc(k) + '" tabindex="0"><div class="line"><span class="w">' + esc(p[0]) + '</span><span class="pos pos-' + p[1] + '">' + p[1] + "</span>"
          + (canSpeak ? '<button class="spk" data-act="sayword" data-w="' + esc(p[0].split("/")[0]) + '" aria-label="Listen to ' + esc(p[0]) + '" title="Listen">' + ICON_SPEAKER_SM + "</button>" : "")
          + '</div><span class="m">' + esc(p[2]) + '</span><span class="eb">' + esc(BN[k] || "") + '</span>' + exHTML(p) + "</li>";
      });
      h += "</ul></div>";
    });
    h += "</div></section>";

    var q = S.quiz[cur];
    h += '<div class="actions"><button class="btn primary" data-act="gotoQuiz">' + (q ? "Retake the quiz (last " + q.s + "/" + q.t + ")" : "Take the quiz") + "</button>"
      + '<button class="btn ghost' + (S.done[cur] ? " good" : "") + '" data-act="done">' + (S.done[cur] ? "Day finished. Tap to undo" : "Mark day done") + "</button></div>";

    $("view").innerHTML = h;
    layoutGroups();
  }

  /* ----- vocabulary columns: 3 on wide screens, 2 on tablets, 1 on phones; groups go to the shortest column ----- */
  var lastCols = 0;
  function colCount() { var w = window.innerWidth; return w >= 720 ? 3 : w >= 480 ? 2 : 1; }
  function layoutGroups() {
    var box = $("words");
    if (!box) return;
    var groups = [].slice.call(box.querySelectorAll(".group"));
    groups.sort(function (a, b) { return a.dataset.gi - b.dataset.gi; });
    var n = (lastCols = colCount());
    box.style.setProperty("--cols", n);
    box.innerHTML = "";
    var cols = [];
    for (var i = 0; i < n; i++) {
      var c = document.createElement("div");
      c.className = "gcol";
      box.appendChild(c);
      cols.push(c);
    }
    groups.forEach(function (g) {
      var shortest = cols[0];
      for (var j = 1; j < n; j++) { if (cols[j].offsetHeight < shortest.offsetHeight) shortest = cols[j]; }
      shortest.appendChild(g);
    });
  }
  window.addEventListener("resize", function () { if (VB.state.view === "learn" && colCount() !== lastCols) layoutGroups(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (VB.state.view === "learn") layoutGroups(); });

  /* ----- toggles and word actions (called from the event router) ----- */
  function toggleStoryBn(btn) { S.bnStory = !S.bnStory; VB.store.save(); $("story").classList.toggle("bn-on", S.bnStory); btn.setAttribute("aria-pressed", S.bnStory); }
  function toggleFullBn(btn) { S.bnFull = !S.bnFull; VB.store.save(); $("trans").hidden = !S.bnFull; btn.setAttribute("aria-pressed", S.bnFull); }
  function toggleWordsBn(btn) { S.bnWords = !S.bnWords; VB.store.save(); $("words").classList.toggle("bnw", S.bnWords); btn.setAttribute("aria-pressed", S.bnWords); layoutGroups(); }
  function toggleEx(btn) {
    S.showEx = S.showEx === false;
    VB.store.save();
    $("words").classList.toggle("showex", S.showEx);
    btn.setAttribute("aria-pressed", S.showEx);
    layoutGroups();
  }
  function toggleRecall(btn) {
    var on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", on);
    $("words").classList.toggle("recall", on);
    $("reveal").hidden = !on;
    if (on) {
      var shown = document.querySelectorAll("#words .e.shown");
      for (var i = 0; i < shown.length; i++) shown[i].classList.remove("shown");
    }
  }
  function revealAll() {
    var all = document.querySelectorAll("#words .e");
    for (var i = 0; i < all.length; i++) all[i].classList.add("shown");
  }
  function highlight(word) {
    var en = VB.vocab.findEntry(VB.state.cur, word);
    if (!en) return;
    var ents = document.querySelectorAll("#words .e");
    for (var i = 0; i < ents.length; i++) {
      if (ents[i].dataset.k === en.k) {
        var el = ents[i];
        el.classList.add("shown");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.remove("flash");
        void el.offsetWidth;
        el.classList.add("flash");
        break;
      }
    }
  }
  function hearStory() { VB.speech.speak(plainStory(VB.vocab.day(VB.state.cur)), "story"); }

  VB.ui.learn = {
    render: render, hearStory: hearStory, toggleStoryBn: toggleStoryBn, toggleFullBn: toggleFullBn,
    toggleWordsBn: toggleWordsBn, toggleEx: toggleEx, toggleRecall: toggleRecall, revealAll: revealAll, highlight: highlight
  };
})();
