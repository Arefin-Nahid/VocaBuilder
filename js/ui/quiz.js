/* Quiz screen: 10 questions per day, or a mixed quiz over a range of days (fill the blank, English meaning, Bangla meaning). */
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
      VB.vocab.nums.forEach(function (i) {
        if (i !== e.day) ENT[i].forEach(function (x) { if (x.pos === e.pos) far.push(x); });
      });
      add(far);
    }
    opts.push({ t: correct, ok: true });
    return { type: kind === "bn" ? "bn" : "en", e: e, opts: u.shuffle(opts) };
  }

  // Up to 4 cloze questions, then meaning questions; weakest words (lowest SRS box) come first.
  // "nums" is one day for a day quiz, or several days for a mixed quiz.
  function build(nums, size) {
    var L = [], cands = [];
    nums.forEach(function (n) {
      L = L.concat(ENT[n]);
      cands = cands.concat(clozeCands(VB.vocab.day(n)));
    });
    var N = Math.min(size, L.length);
    cands = u.shuffle(cands);
    var items = [], used = {};
    cands.forEach(function (c) {
      if (items.length < Math.min(4, N) && !used[c.e.k]) { used[c.e.k] = 1; items.push(clozeQ(c, c.e.day)); }
    });
    var rest = u.shuffle(L).filter(function (x) { return !used[x.k]; }).sort(function (a, b) {
      var ba = S.srs[a.k] ? S.srs[a.k].b : 0, bb = S.srs[b.k] ? S.srs[b.k].b : 0;
      return ba - bb;
    });
    var n = 0;
    while (items.length < N && rest.length) {
      var e = rest.shift();
      if (used[e.k]) continue;
      used[e.k] = 1;
      items.push(meaningQ(e, (n++ % 3 === 2 && BN[e.k]) ? "bn" : "en"));
    }
    return u.shuffle(items);
  }

  function posTag(p) { return '<span class="pos pos-' + p + '">' + p + "</span>"; }

  function feedbackHTML(it, ok) {
    var e = it.e;
    return '<div class="fb ' + (ok ? "ok" : "no") + '"><div class="res">' + (ok ? "Correct" : "Not quite. The answer is highlighted") + "</div><div><b>" + esc(e.w) + "</b> " + posTag(e.pos) + " " + esc(e.m) + '</div><div class="bnt">' + esc(BN[e.k] || "") + "</div></div>";
  }

  // Header line of a quiz: the day for a day quiz, the range for a mixed quiz.
  function whenLabel(Q) {
    if (!Q.range) return esc(VB.vocab.day(Q.day).t);
    var a = VB.vocab.day(Q.range[0]).t, b = VB.vocab.day(Q.range[Q.range.length - 1]).t;
    return "Mixed quiz · " + esc(Q.range.length === 1 ? a : a + " to " + b);
  }

  function rangeSelect(id, sel) {
    var h = '<select id="' + id + '" data-rg="' + id + '" aria-label="' + (id === "qFrom" ? "From page" : "To page") + '">';
    VB.vocab.nums.forEach(function (n) { h += '<option value="' + n + '"' + (n === sel ? " selected" : "") + ">" + esc(VB.vocab.day(n).t) + "</option>"; });
    return h + "</select>";
  }

  var TYPE_LABEL = { cloze: "Fill the blank", en: "Meaning in English", bn: "Meaning in Bangla" };
  var LETTERS = ["A", "B", "C", "D", "E"];

  function fmtScoreBar(q) {
    var p = Math.round(q.s / q.t * 100);
    return '<div class="qlast"><div><span class="qlast-k">Last score</span><b>' + q.s + " / " + q.t + '</b><span class="qlast-d">' + u.fmtDate(q.d) + '</span></div><div class="mini" aria-hidden="true"><i style="width:' + p + '%"></i></div></div>';
  }

  function render() {
    var st = VB.state, cur = st.cur, Q = st.Q, d = VB.vocab.day(cur);
    if (!Q || (!Q.range && Q.day !== cur)) {
      var q = S.quiz[cur], rg = st.rg || { from: VB.vocab.nums[0], to: cur }, finished = VB.progress.finishedDays();
      var cnt = Math.min(cfg.quizSize, ENT[cur].length);
      $("view").innerHTML = '<div><div class="when">' + esc(d.t) + "</div><h1>Quiz</h1></div>"
        + '<section class="card qhero"><div class="qh-top"><span class="qh-num">' + cnt + '</span><span class="qh-sub">questions<br>on this page</span></div>'
        + '<ul class="qtypes"><li><i class="qt cz"></i>Fill the blank</li><li><i class="qt en"></i>English meaning</li><li><i class="qt bn"></i>Bangla meaning</li></ul>'
        + '<p class="qhint">Words you found hard come up first, so every round trains what you need most.</p>'
        + (q ? fmtScoreBar(q) : "")
        + '<button class="btn primary qgo" data-act="startQuiz">' + (q ? "Take it again" : "Start quiz") + "</button></section>"
        + '<section class="card rangeq"><div class="qsec"><h2>Mixed quiz</h2><span class="qchip">Stronger recall</span></div><p class="qhint" style="margin:0 0 12px">Mix words from several pages in one round.</p>'
        + '<div class="rgrow"><label>From ' + rangeSelect("qFrom", rg.from) + "</label><label>To " + rangeSelect("qTo", rg.to) + "</label></div>"
        + '<div class="finish" style="margin-top:12px"><button class="btn primary" data-act="startRange">Quiz these pages</button>'
        + '<button class="btn" data-act="startFinished"' + (finished.length ? "" : " disabled") + ">All finished pages</button></div></section>";
      return;
    }
    if (Q.i >= Q.items.length) return renderResult();

    var it = Q.items[Q.i], h = "", right = Q.res.filter(Boolean).length;
    h += '<div class="qtop"><div class="qmeta"><span class="qwhen">' + whenLabel(Q) + '</span><span class="qscore" title="Correct so far">' + right + " correct</span></div>";
    h += '<div class="steps" role="progressbar" aria-valuemin="0" aria-valuemax="' + Q.items.length + '" aria-valuenow="' + Q.i + '">';
    Q.items.forEach(function (x, i) { h += "<i" + (i < Q.i || (i === Q.i && Q.ans !== null) ? ' class="ok"' : i === Q.i ? ' class="cur"' : "") + "></i>"; });
    h += "</div>";
    h += '<div class="qcount">Question ' + (Q.i + 1) + " of " + Q.items.length + "</div></div>";
    h += '<section class="card qcard"><div class="qlabel"><span class="qt ' + (it.type === "cloze" ? "cz" : it.type) + '"></span>' + TYPE_LABEL[it.type] + "</div>";
    if (it.type === "cloze") {
      h += '<p class="qtext">' + esc(it.text).replace("\u0001", '<span class="blank">&nbsp;</span>') + "</p>";
    } else {
      h += '<div class="qword">' + esc(it.e.w) + " " + posTag(it.e.pos) + "</div>";
    }
    h += '<div class="opts" role="group" aria-label="Answers">';
    it.opts.forEach(function (o, i) {
      var cls = "opt" + (it.type === "bn" ? " bnopt" : ""), mark = "";
      if (Q.ans !== null) {
        if (o.ok) { cls += " ok"; mark = '<span class="om" aria-hidden="true">&#10003;</span>'; }
        else if (i === Q.ans) { cls += " no"; mark = '<span class="om" aria-hidden="true">&#10005;</span>'; }
        else cls += " dim";
      }
      h += '<button class="' + cls + '" data-act="ans" data-i="' + i + '"' + (Q.ans !== null ? " disabled" : "") + '><span class="ol">' + LETTERS[i] + '</span><span class="ot">' + esc(o.t) + "</span>" + mark + "</button>";
    });
    h += "</div>";
    if (Q.ans !== null) {
      h += feedbackHTML(it, it.opts[Q.ans].ok);
      h += '<button class="btn primary qgo" data-act="nextQ">' + (Q.i + 1 >= Q.items.length ? "See results" : "Next question") + "</button>";
    }
    h += "</section>";
    if (Q.ans === null) h += '<p class="qkeys">Tip: press 1 to ' + it.opts.length + " to answer.</p>";
    $("view").innerHTML = h;
  }

  function renderResult() {
    var st = VB.state, cur = st.cur, Q = st.Q;
    var miss = Q.items.filter(function (x, i) { return !Q.res[i]; });
    var total = Q.items.length, score = total - miss.length, pct = Math.round(score / total * 100);
    var tier = pct === 100 ? "Perfect round" : pct >= 80 ? "Excellent work" : pct >= 60 ? "Good progress" : pct >= 40 ? "Getting there" : "Keep practising";
    var h = '<div><div class="when">' + whenLabel(Q) + "</div><h1>Results</h1></div>";
    h += '<section class="card qres"><div class="ring" style="--p:' + pct + '" role="img" aria-label="' + score + " correct out of " + total + '"><div><b>' + score + "</b><span>of " + total + "</span></div></div>";
    h += '<div class="qres-t"><div class="qres-h">' + tier + '</div><p>' + (miss.length ? "Missed words will come back in Review sooner." : "All correct. These words move to a longer review gap.") + "</p>";
    h += '<div class="qstats"><span class="s ok">' + score + ' correct</span><span class="s no">' + miss.length + " missed</span><span class=\"s\">" + pct + "%</span></div></div></section>";
    if (miss.length) {
      h += '<section class="card"><h2 class="label" style="margin:0 0 10px">Words to revisit</h2><ul class="miss">';
      miss.forEach(function (x) { h += "<li><div><b>" + esc(x.e.w) + "</b> " + posTag(x.e.pos) + "</div><div>" + esc(x.e.m) + '</div><div class="bnt" style="font-family:var(--f-bn);color:var(--accent)">' + esc(BN[x.e.k] || "") + "</div></li>"; });
      h += "</ul></section>";
    }
    var nx = VB.vocab.neighbor(cur, 1);
    h += '<div class="finish"><button class="btn primary" data-act="' + (Q.range ? "retryRange" : "startQuiz") + '">Try a new quiz</button><button class="btn" data-act="tab" data-tab="' + (Q.range ? "quiz" : "learn") + '">' + (Q.range ? "Back to quizzes" : "Back to the lesson") + "</button>" + (!Q.range && nx ? '<button class="btn" data-act="nextDay">Next: ' + esc(VB.vocab.day(nx).t) + "</button>" : "") + "</div>";
    $("view").innerHTML = h;
  }

  /* ----- actions ----- */
  function start() {
    var st = VB.state;
    st.Q = { day: st.cur, range: null, items: build([st.cur], cfg.quizSize), i: 0, ans: null, res: [] };
    VB.render(); window.scrollTo(0, 0);
  }
  function startNums(nums) {
    if (!nums.length) return;
    VB.state.Q = { day: null, range: nums, items: build(nums, cfg.rangeQuizSize), i: 0, ans: null, res: [] };
    VB.render(); window.scrollTo(0, 0);
  }
  // Mixed quiz over the days picked in the From / To boxes (works in either order).
  function startRange() {
    var f = +$("qFrom").value, t = +$("qTo").value, P = VB.vocab.pos;
    if (P(f) > P(t)) { var x = f; f = t; t = x; }
    VB.state.rg = { from: f, to: t };
    startNums(VB.vocab.nums.filter(function (n) { return P(n) >= P(f) && P(n) <= P(t); }));
  }
  function startFinished() { startNums(VB.progress.finishedDays()); }
  function retryRange() { startNums(VB.state.Q.range); }
  function rememberRange() {
    var f = $("qFrom"), t = $("qTo");
    if (f && t) VB.state.rg = { from: +f.value, to: +t.value };
  }
  function answer(i) {
    var Q = VB.state.Q;
    if (Q.ans !== null) return;
    Q.ans = i;
    var it = Q.items[Q.i], ok = it.opts[i].ok;
    Q.res[Q.i] = ok;
    VB.srs.grade(it.e.k, ok ? "good" : "again");
    VB.progress.touch();
    VB.store.save();
    VB.render();
  }
  function next() {
    var st = VB.state, Q = st.Q;
    Q.i++; Q.ans = null;
    if (Q.i >= Q.items.length && !Q.range) {
      var sc = Q.res.filter(Boolean).length;
      S.quiz[st.cur] = { s: sc, t: Q.items.length, d: VB.calendar.today };
      VB.srs.ensure(VB.vocab.dayKeys(st.cur));
      VB.store.save();
    }
    VB.render(); window.scrollTo(0, 0);
  }

  document.addEventListener("keydown", function (ev) {
    var st = VB.state, Q = st && st.Q;
    if (!st || st.view !== "quiz" || !Q || Q.i >= Q.items.length || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var t = ev.target && ev.target.tagName;
    if (t === "SELECT" || t === "INPUT" || t === "TEXTAREA") return;
    var n = parseInt(ev.key, 10);
    if (Q.ans === null && n >= 1 && n <= Q.items[Q.i].opts.length) { ev.preventDefault(); answer(n - 1); }
    else if (Q.ans !== null && ev.key === "Enter" && t !== "BUTTON") { ev.preventDefault(); next(); }
  });

  VB.ui.quiz = { render: render, start: start, startRange: startRange, startFinished: startFinished, retryRange: retryRange, rememberRange: rememberRange, answer: answer, next: next };
})();
