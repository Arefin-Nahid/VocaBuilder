/* Review screen: spaced-repetition flashcards for every word that is due. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, esc = u.esc, S = VB.store.S, BN = VB.vocab.BN, cfg = VB.config;

  function posTag(p) { return '<span class="pos pos-' + p + '">' + p + "</span>"; }
  function ico(d, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; }
  var I = {
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    spk: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
    again: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    hard: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
    good: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    play: '<path d="M7 4v16l13-8z"/>'
  };
  function gap(d) { return d <= 1 ? "Tomorrow" : d + " days"; }
  function sentence(e) {
    var t = VB.vocab.example(e);
    return t ? esc(t).replace(/\*([^*]+)\*/g, '<mark class="rv-w">$1</mark>') : "";
  }

  function render() {
    var st = VB.state, R = st.R, due = VB.srs.dueKeys(), h = "", k;
    var cnt = [0, 0, 0, 0, 0];
    for (k in S.srs) cnt[S.srs[k].b - 1]++;

    if (R && R.i < R.deck.length) {
      var key = R.deck[R.i], e = VB.vocab.ALL[key], b = S.srs[key].b, iv = cfg.intervals;
      h += '<div class="rv-top"><div class="rv-prog"><span>Card ' + (R.i + 1) + " of " + R.deck.length + '</span><div class="bar" aria-hidden="true"><i style="width:' + (R.i / R.deck.length * 100) + '%"></i></div></div>'
        + '<button class="rv-x" data-act="endReview" aria-label="End session" title="End session">' + ico(I.x, 18) + "</button></div>";
      h += '<section class="card rv-card"><div class="rv-chips"><span class="rv-chip">Box ' + b + '</span><span class="rv-chip soft">' + esc(VB.vocab.day(e.day).t) + "</span></div>";
      h += '<div class="rv-word"><div class="rv-wt">' + esc(e.w) + "</div>" + posTag(e.pos)
        + (VB.speech.supported ? '<button class="spk rv-spk" data-act="sayword" data-w="' + esc(e.w) + '" aria-label="Listen to ' + esc(e.w) + '" title="Listen">' + ico(I.spk, 20) + "</button>" : "") + "</div>";
      if (!R.flip) {
        h += '<p class="rv-hint">Recall the meaning first, then check yourself.</p>'
          + '<button class="btn primary rv-show" data-act="flip">' + ico(I.eye, 18) + "<span>Show answer</span></button>";
      } else {
        var ex = sentence(e);
        h += '<div class="rv-ans"><div class="rv-row"><span class="rv-k">English</span><p>' + esc(e.m) + "</p></div>"
          + '<div class="rv-row"><span class="rv-k">বাংলা</span><p class="bnt">' + esc(BN[key] || "") + "</p></div>"
          + (ex ? '<div class="rv-row"><span class="rv-k">Sentence</span><p class="rv-ex">' + ex + "</p>"
            + (VB.speech.supported ? '<button class="spk" data-act="saysent" data-k="' + esc(key) + '" aria-label="Listen to the sentence" title="Listen">' + ico(I.spk, 17) + "</button>" : "") + "</div>" : "")
          + "</div>";
        h += '<div class="rv-rate" role="group" aria-label="How well did you remember?">'
          + '<button data-act="rate" data-r="again" class="again">' + ico(I.again, 20) + "<b>Forgot</b><span>" + gap(1) + "</span></button>"
          + '<button data-act="rate" data-r="hard" class="hard">' + ico(I.hard, 20) + "<b>Hard</b><span>" + gap(Math.max(1, Math.floor(iv[b - 1] / 2))) + "</span></button>"
          + '<button data-act="rate" data-r="good" class="good">' + ico(I.good, 20) + "<b>Got it</b><span>" + gap(iv[Math.min(5, b + 1) - 1]) + "</span></button></div>";
      }
      h += "</section>";
      if (!R.flip) h += '<p class="qkeys">Tip: press Space to show the answer.</p>';
      else h += '<p class="qkeys">Tip: press 1, 2 or 3 to rate.</p>';
    } else if (R) {
      h += '<div><div class="when">Review</div><h1>Session complete</h1></div><section class="card rv-done"><div class="rv-tick">' + ico(I.good, 34) + '</div><div class="score">' + R.deck.length + '</div><p>cards reviewed</p>'
        + '<div class="qstats"><span class="s no">Forgot ' + R.st.again + '</span><span class="s">Hard ' + R.st.hard + '</span><span class="s ok">Got it ' + R.st.good + '</span></div>'
        + '<button class="btn primary qgo" data-act="endReview">Done</button></section>';
    } else {
      var msg = due.length ? "words are waiting for you today" : (Object.keys(S.srs).length ? "All caught up. Come back tomorrow." : "No words yet. Take a quiz or finish a page and its words appear here.");
      h += '<div><div class="when">Spaced review</div><h1>Review</h1></div>';
      h += '<section class="rv-hero"><div class="rv-hn">' + due.length + '</div><div class="rv-hl">' + msg + "</div>"
        + (due.length ? '<button class="rv-go" data-act="startReview">' + ico(I.play, 16) + "<span>Start review</span></button><div class=\"rv-hs\">Up to " + cfg.reviewSize + " cards, hardest first</div>" : '<button class="rv-go" data-act="tab" data-tab="learn"><span>Go to the lesson</span></button>') + "</section>";
      h += '<section class="card"><h2 class="rv-h2">Your boxes</h2><div class="boxes" style="margin-top:12px">';
      var names = ["Box 1 · tomorrow", "Box 2 · 2 days", "Box 3 · 4 days", "Box 4 · 8 days", "Box 5 · 16 days"];
      cnt.forEach(function (c, i) { h += '<div class="box"><b>' + c + "</b><span>" + names[i] + "</span></div>"; });
      h += '</div></section>'
        + '<details class="card how"><summary><span class="how-i" aria-hidden="true">?</span><span>How review works</span></summary><ul class="how-l">'
        + '<li><b>Remember it</b><span>The word moves up one box and returns after a longer gap.</span></li>'
        + '<li><b>Forget it</b><span>It drops back to Box 1 and returns tomorrow.</span></li>'
        + '<li><b>Mixed on purpose</b><span>Words from different pages are shuffled together, which makes memory stronger.</span></li></ul></details>';
    }
    $("view").innerHTML = h;
  }

  /* ----- actions ----- */
  function start() {
    var deck = u.shuffle(VB.srs.dueKeys()).sort(function (x, y) { return S.srs[x].b - S.srs[y].b; }).slice(0, cfg.reviewSize);
    VB.state.R = { deck: deck, i: 0, flip: false, st: { again: 0, hard: 0, good: 0 } };
    VB.render();
  }
  function flip() { VB.state.R.flip = true; VB.render(); }
  function rate(r) {
    var R = VB.state.R;
    VB.srs.grade(R.deck[R.i], r);
    VB.progress.touch();
    R.st[r]++;
    VB.store.save();
    R.i++; R.flip = false;
    VB.render(); window.scrollTo(0, 0);
  }
  function end() { VB.state.R = null; VB.render(); }

  document.addEventListener("keydown", function (ev) {
    var R = VB.state && VB.state.R;
    if (!R || VB.state.view !== "review" || R.i >= R.deck.length || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var t = ev.target && ev.target.tagName;
    if (t === "SELECT" || t === "INPUT" || t === "TEXTAREA") return;
    if (!R.flip && ev.key === " " && t !== "BUTTON") { ev.preventDefault(); flip(); }
    else if (R.flip && { "1": "again", "2": "hard", "3": "good" }[ev.key]) { ev.preventDefault(); rate({ "1": "again", "2": "hard", "3": "good" }[ev.key]); }
  });

  VB.ui.review = { render: render, start: start, flip: flip, rate: rate, end: end };
})();
