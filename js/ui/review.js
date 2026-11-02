/* Review screen: spaced-repetition flashcards for every word that is due. */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, esc = u.esc, S = VB.store.S, BN = VB.vocab.BN, cfg = VB.config;

  function posTag(p) { return '<span class="pos pos-' + p + '">' + p + "</span>"; }

  function render() {
    var st = VB.state, R = st.R, due = VB.srs.dueKeys(), h = "", k;
    var cnt = [0, 0, 0, 0, 0];
    for (k in S.srs) cnt[S.srs[k].b - 1]++;

    if (R && R.i < R.deck.length) {
      var key = R.deck[R.i], e = VB.vocab.ALL[key];
      h += '<div><div class="qmeta"><span>Review</span><span>Card ' + (R.i + 1) + " of " + R.deck.length + '</span></div><div class="bar" aria-hidden="true"><i style="width:' + (R.i / R.deck.length * 100) + '%"></i></div></div>';
      h += '<section class="card flash-card"><div class="qlabel" style="margin:0">Say the meaning in your head first</div><div class="fc-word">' + esc(e.w) + " " + posTag(e.pos) + "</div>";
      if (!R.flip) {
        h += '<div class="tools"><button class="btn primary" data-act="flip">Show answer</button>' + (VB.speech.supported ? '<button class="btn" data-act="sayword" data-w="' + esc(e.w) + '">Hear it</button>' : "") + "</div>";
      } else {
        h += '<div class="fc-ans"><div>' + esc(e.m) + '</div><div class="bnt">' + esc(BN[key] || "") + '</div></div><div class="fc-src">From day ' + e.day + ": " + esc(VB.vocab.day(e.day).t) + " · box " + S.srs[key].b + " of 5</div>";
        h += '<div class="rate" style="width:100%"><button class="btn" data-act="rate" data-r="again">Forgot</button><button class="btn" data-act="rate" data-r="hard">Hard</button><button class="btn good" data-act="rate" data-r="good">Got it</button></div>';
      }
      h += "</section>";
    } else if (R) {
      h += '<div><div class="when">Review</div><h1>Session complete</h1></div><section class="card empty"><div class="score">' + R.deck.length + '</div><p style="margin:0">cards reviewed. Forgot ' + R.st.again + ", hard " + R.st.hard + ", got it " + R.st.good + '.</p><button class="btn primary" data-act="endReview">Done</button></section>';
    } else {
      h += '<div><div class="when">Spaced review</div><h1>Review</h1></div>';
      h += '<section class="card"><div class="score">' + due.length + '</div><p style="margin:8px 0 12px;color:var(--muted)">' + (due.length ? "words are due today. Each session has up to " + cfg.reviewSize + " cards, hardest first." : (Object.keys(S.srs).length ? "Nothing due today. Come back tomorrow." : "No words yet. Take a quiz or mark a day finished and its words appear here tomorrow.")) + "</p>"
        + (due.length ? '<button class="btn primary" data-act="startReview">Start review</button>' : '<button class="btn" data-act="tab" data-tab="learn">Go to the lesson</button>')
        + '<div class="boxes">';
      var names = ["Box 1 · tomorrow", "Box 2 · 2 days", "Box 3 · 4 days", "Box 4 · 8 days", "Box 5 · 16 days"];
      cnt.forEach(function (c, i) { h += '<div class="box"><b>' + c + "</b><span>" + names[i] + "</span></div>"; });
      h += '</div></section><details class="card how"><summary>How review works</summary><p>Every word sits in one of five boxes. A word you remember moves up a box and returns after a longer gap. A word you forget drops to box 1 and returns tomorrow. Words from different days are mixed together on purpose, because mixing makes memory stronger.</p></details>';
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

  VB.ui.review = { render: render, start: start, flip: flip, rate: rate, end: end };
})();
