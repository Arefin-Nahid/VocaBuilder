/* Quiz screen: 10 questions per day (fill the blank, English meaning, Bangla meaning). */
(function () {
  "use strict";
  var VB = window.VB, u = VB.utils, $ = u.$, esc = u.esc, S = VB.store.S, BN = VB.vocab.BN, ENT = VB.vocab.ENT, cfg = VB.config;

  function sentences(s) { return s.split(/(?<=[.!?]["”]?)\s+/); }

  // Every highlighted word in a long-enough sentence can become a fill-the-blank question.
  function clozeCands(d) {
    var out = [];
    sentences(d.s).forEach(function (sen) {
      var toks = [];
      sen.replace(/\*([^*]+)\*/g, function (m, w) { toks.push(w); });
      if (sen.replace(/\*/g, "").split(/\s+/).length < 6) return;
      toks.forEach(function (t, ti) {
        var key = t.toLowerCase(), e = null;
        ENT[d.n].forEach(function (x) { if (!e && x.k === key && /^[a-zé\-]+$/.test(x.k)) e = x; });
        if (!e) return;
        var idx = -1;
        var txt = sen.replace(/\*([^*]+)\*/g, function (m, w) { idx++; return idx === ti ? "\u0001" : w; });
        out.push({ e: e, text: txt });
      });
    });
    return out;
  }

  function clozeQ(c, day) {
    var low = c.text.toLowerCase();
    var ents = ENT[day].filter(function (x) { return x.k !== c.e.k && /^[a-zé\-]+$/.test(x.k) && low.indexOf(x.k) < 0; });
    var same = ents.filter(function (x) { return x.pos === c.e.pos; });
    var pool = u.shuffle(same).concat(u.shuffle(ents.filter(function (x) { return x.pos !== c.e.pos; })));
    var opts = pool.slice(0, 3).map(function (x) { return { t: x.k, ok: false }; });
    opts.push({ t: c.e.k, ok: true });
    return { type: "cloze", e: c.e, text: c.text, opts: u.shuffle(opts) };
  }

  function meaningQ(e, kind) {
    var field = function (x) { return kind === "bn" ? BN[x.k] : x.m; };
    var correct = field(e), seen = {}, opts = [];
    seen[String(correct).toLowerCase()] = 1;
    function add(list) {
      u.shuffle(list).forEach(function (x) {
        if (opts.length >= 3 || x.k === e.k) return;
        var f = field(x);
        if (!f) return;
        var lk = String(f).toLowerCase();
        if (seen[lk]) return;
        seen[lk] = 1;
        opts.push({ t: f, ok: false });
      });
    }
    var other = ENT[e.day].filter(function (x) { return x.gi !== e.gi; });
    add(other.filter(function (x) { return x.pos === e.pos; }));
    add(other);
    add(ENT[e.day].filter(function (x) { return x.gi === e.gi; }));
    if (opts.length < 3) {
      var far = [];
      for (var i = 1; i <= cfg.totalDays; i++) {
        if (i !== e.day && ENT[i]) ENT[i].forEach(function (x) { if (x.pos === e.pos) far.push(x); });
      }
      add(far);
    }
    opts.push({ t: correct, ok: true });
    return { type: kind === "bn" ? "bn" : "en", e: e, opts: u.shuffle(opts) };
  }

  // Up to 4 cloze questions, then meaning questions; weakest words (lowest SRS box) come first.
  function build(day) {
    var L = ENT[day], N = Math.min(cfg.quizSize, L.length);
    var cands = u.shuffle(clozeCands(VB.vocab.DAYS[day - 1]));
    var items = [], used = {};
    cands.forEach(function (c) {
      if (items.length < Math.min(4, N) && !used[c.e.k]) { used[c.e.k] = 1; items.push(clozeQ(c, day)); }
    });
    var rest = u.shuffle(L).filter(function (x) { return !used[x.k]; }).sort(function (a, b) {
      var ba = S.srs[a.k] ? S.srs[a.k].b : 0, bb = S.srs[b.k] ? S.srs[b.k].b : 0;
      return ba - bb;
    });
    var n = 0;
    while (items.length < N && rest.length) {
      var e = rest.shift();
      items.push(meaningQ(e, (n++ % 3 === 2 && BN[e.k]) ? "bn" : "en"));
    }
    return u.shuffle(items);
  }

  function posTag(p) { return '<span class="pos pos-' + p + '">' + p + "</span>"; }

  function feedbackHTML(it, ok) {
    var e = it.e;
    return '<div class="fb"><div class="res ' + (ok ? "ok" : "no") + '">' + (ok ? "Correct" : "Not quite") + "</div><div><b>" + esc(e.w) + "</b> " + posTag(e.pos) + " " + esc(e.m) + '</div><div class="bnt">' + esc(BN[e.k] || "") + "</div></div>";
  }

  function render() {
    var st = VB.state, cur = st.cur, Q = st.Q, d = VB.vocab.DAYS[cur - 1];
    if (!Q || Q.day !== cur) {
      var q = S.quiz[cur];
      $("view").innerHTML = '<div><div class="when">Day ' + cur + " · " + esc(d.t) + "</div><h1>Quiz</h1></div>"
        + '<section class="card empty" style="text-align:left;justify-items:start"><p style="margin:0">' + Math.min(cfg.quizSize, ENT[cur].length) + " questions: some fill a blank in a sentence from the story, others ask for a meaning in English or Bangla. Words you have found hard come up first.</p>"
        + (q ? '<p style="margin:0;color:var(--muted)">Last score: <b>' + q.s + " of " + q.t + "</b> on " + u.fmtDate(q.d) + ".</p>" : "")
        + '<button class="btn primary" data-act="startQuiz">Start quiz</button></section>';
      return;
    }
    if (Q.i >= Q.items.length) return renderResult();

    var it = Q.items[Q.i], h = "";
    h += '<div><div class="qmeta"><span>Day ' + cur + " · " + esc(d.t) + "</span><span>Question " + (Q.i + 1) + " of " + Q.items.length + '</span></div><div class="bar" aria-hidden="true"><i style="width:' + (Q.i / Q.items.length * 100) + '%"></i></div></div>';
    h += '<section class="card">';
    if (it.type === "cloze") {
      h += '<div class="qlabel">Fill the blank</div><p class="qtext">' + esc(it.text).replace("\u0001", '<span class="blank">&nbsp;</span>') + "</p>";
    } else {
      h += '<div class="qlabel">' + (it.type === "bn" ? "Pick the Bangla meaning" : "Pick the meaning") + '</div><div class="qword">' + esc(it.e.w) + " " + posTag(it.e.pos) + "</div>";
    }
    h += '<div class="opts">';
    it.opts.forEach(function (o, i) {
      var cls = "opt" + (it.type === "bn" ? " bnopt" : "");
      if (Q.ans !== null) { if (o.ok) cls += " ok"; else if (i === Q.ans) cls += " no"; }
      h += '<button class="' + cls + '" data-act="ans" data-i="' + i + '"' + (Q.ans !== null ? " disabled" : "") + ">" + esc(o.t) + "</button>";
    });
    h += "</div>";
    if (Q.ans !== null) {
      h += feedbackHTML(it, it.opts[Q.ans].ok);
      h += '<div class="finish" style="margin-top:12px"><button class="btn primary" data-act="nextQ">' + (Q.i + 1 >= Q.items.length ? "See results" : "Next question") + "</button></div>";
    }
    h += "</section>";
    $("view").innerHTML = h;
  }

  function renderResult() {
    var st = VB.state, cur = st.cur, Q = st.Q;
    var miss = Q.items.filter(function (x, i) { return !Q.res[i]; });
    var score = Q.items.length - miss.length;
    var h = '<div><div class="when">Day ' + cur + " · " + esc(VB.vocab.DAYS[cur - 1].t) + "</div><h1>Quiz finished</h1></div>";
    h += '<section class="card"><div class="score">' + score + " / " + Q.items.length + '</div><p style="margin:8px 0 0;color:var(--muted)">' + (miss.length ? "The words you missed will come back in Review sooner." : "All correct. These words move to a longer review gap.") + "</p>";
    if (miss.length) {
      h += '<ul class="miss">';
      miss.forEach(function (x) { h += "<li><div><b>" + esc(x.e.w) + "</b> " + posTag(x.e.pos) + "</div><div>" + esc(x.e.m) + '</div><div class="bnt" style="font-family:var(--f-bn);color:var(--accent)">' + esc(BN[x.e.k] || "") + "</div></li>"; });
      h += "</ul>";
    }
    h += '</section><div class="finish"><button class="btn primary" data-act="startQuiz">Try a new quiz</button><button class="btn" data-act="tab" data-tab="learn">Back to the lesson</button>' + (cur < cfg.totalDays ? '<button class="btn" data-act="nextDay">Go to day ' + (cur + 1) + "</button>" : "") + "</div>";
    $("view").innerHTML = h;
  }

  /* ----- actions ----- */
  function start() {
    var st = VB.state;
    st.Q = { day: st.cur, items: build(st.cur), i: 0, ans: null, res: [] };
    VB.render(); window.scrollTo(0, 0);
  }
  function answer(i) {
    var Q = VB.state.Q;
    if (Q.ans !== null) return;
    Q.ans = i;
    var it = Q.items[Q.i], ok = it.opts[i].ok;
    Q.res[Q.i] = ok;
    VB.srs.grade(it.e.k, ok ? "good" : "again");
    VB.store.save();
    VB.render();
  }
  function next() {
    var st = VB.state, Q = st.Q;
    Q.i++; Q.ans = null;
    if (Q.i >= Q.items.length) {
      var sc = Q.res.filter(Boolean).length;
      S.quiz[st.cur] = { s: sc, t: Q.items.length, d: VB.calendar.today };
      VB.srs.ensure(VB.vocab.dayKeys(st.cur));
      VB.store.save();
    }
    VB.render(); window.scrollTo(0, 0);
  }

  VB.ui.quiz = { render: render, start: start, answer: answer, next: next };
})();
