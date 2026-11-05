/* Progress saved in the browser (localStorage), plus the merge rules used by cloud sync.
   Every changed item (a finished page, a word's review box, a quiz score, a setting) gets a time stamp in S.m,
   so two devices can be merged item by item and the newest change always wins. */
(function () {
  "use strict";
  var VB = window.VB, cfg = VB.config;

  var S = { done: {}, srs: {}, bnStory: false, bnWords: false, bnFull: false, quiz: {}, active: {}, m: {} };
  var FLAGS = ["bnStory", "bnWords", "bnFull", "showEx"];
  var prev = {};

  function j(v) { var s = JSON.stringify(v === undefined ? null : v); return s; }

  // One flat map of every syncable item: key -> text value.
  function items(o) {
    var out = {}, k;
    for (k in (o.done || {})) out["d:" + k] = "1";
    for (k in (o.srs || {})) out["s:" + k] = j(o.srs[k]);
    for (k in (o.quiz || {})) out["q:" + k] = j(o.quiz[k]);
    FLAGS.forEach(function (f) { out["f:" + f] = j(o[f]); });
    return out;
  }
  function setItem(key, val) {
    var t = key.charAt(0), name = key.slice(2);
    if (t === "d") { if (val === undefined) delete S.done[name]; else S.done[name] = 1; }
    else if (t === "s") { if (val === undefined) delete S.srs[name]; else S.srs[name] = JSON.parse(val); }
    else if (t === "q") { if (val === undefined) delete S.quiz[name]; else S.quiz[name] = JSON.parse(val); }
    else if (t === "f") { var v = val === undefined ? null : JSON.parse(val); if (v === null) delete S[name]; else S[name] = v; }
  }

  function persist() { try { localStorage.setItem(cfg.storageKey, JSON.stringify(S)); } catch (e) {} }

  function load() {
    try {
      var raw = localStorage.getItem(cfg.storageKey);
      if (raw) {
        var o = JSON.parse(raw);
        for (var k in o) S[k] = o[k];
      } else {
        var old = localStorage.getItem(cfg.legacyKey);
        if (old) S.done = JSON.parse(old) || {};
      }
    } catch (e) {}
    if (!S.m) S.m = {};
    prev = items(S);
  }

  // Save: stamp whatever changed since the last save, write to the browser, then tell sync there is something new.
  function save() {
    var cur = items(S), now = Date.now(), k;
    for (k in cur) if (prev[k] !== cur[k]) S.m[k] = now;
    for (k in prev) if (!(k in cur)) S.m[k] = now;
    prev = cur;
    persist();
    if (VB.sync && VB.sync.queue) VB.sync.queue();
  }

  // What is uploaded to the cloud.
  function payload() { return JSON.stringify(S); }

  // Merge a copy from the cloud into this device. Returns { changed, push }:
  // changed = this device took something new, push = this device holds something newer than the cloud.
  function mergeRemote(R) {
    var changed = false, push = false, k;
    var local = items(S), remote = items(R), rm = R.m || {};
    var keys = {};
    for (k in local) keys[k] = 1;
    for (k in remote) keys[k] = 1;
    for (k in rm) keys[k] = 1;
    for (k in keys) {
      var lv = local[k], rv = remote[k], lt = S.m[k] || 0, rt = rm[k] || 0, useRemote;
      if (lv === rv) { if (rt > lt) S.m[k] = rt; continue; }
      if (rt > lt) useRemote = true;
      else if (lt > rt) useRemote = false;
      else useRemote = lv === undefined; // same stamp: keep whichever side has the item
      if (useRemote) { setItem(k, rv); S.m[k] = rt; changed = true; }
      else { push = true; }
    }
    // Days you studied: simply combine.
    if (!S.active) S.active = {};
    for (k in (R.active || {})) if (!S.active[k]) { S.active[k] = 1; changed = true; }
    for (k in S.active) if (!(R.active && R.active[k])) push = true;
    prev = items(S);
    if (changed) persist();
    return { changed: changed, push: push };
  }

  VB.store = { S: S, load: load, save: save, payload: payload, mergeRemote: mergeRemote };
})();
