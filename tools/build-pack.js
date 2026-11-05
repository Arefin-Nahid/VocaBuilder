#!/usr/bin/env node
/* Builds a content pack from one text file per page.
   Usage:  node tools/build-pack.js tools/source/pack-043-067 js/data/pack-043-067.js
   Then:   node tools/update-packs.js && node tools/check-data.js

   Page file format (d68.txt, d69.txt ...):
     N: 68                         page number
     T: Title                      head word title ("Title (continued)" joins the previous head word)
     S: story with *starred* words (every word of the page, inflected forms allowed)
     B: Bangla translation of the story
     # Group name                  starts a word group
     word|pos|English meaning|Bangla meaning|Example sentence with the *word* starred
   A word already defined in an earlier pack (or earlier page) is still listed in its group,
   but its Bangla meaning and example are reused, not redefined. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const [srcDir, outFile] = process.argv.slice(2);
if (!srcDir || !outFile) { console.error("Usage: node tools/build-pack.js <sourceDir> <outFile>"); process.exit(1); }
const root = path.join(__dirname, "..");

// words already known from the other packs
global.window = global; window.VB_PACKS = [];
const outAbs = path.resolve(outFile);
fs.readdirSync(path.join(root, "js/data")).filter(f => /^pack-.*\.js$/.test(f)).forEach(f => {
  if (path.resolve(root, "js/data", f) !== outAbs) vm.runInThisContext(fs.readFileSync(path.join(root, "js/data", f), "utf8"));
});
const known = {}; window.VB_PACKS.forEach(p => Object.keys(p.bn).forEach(k => known[k] = 1));

const files = fs.readdirSync(srcDir).filter(f => /^d\d+\.txt$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
const POS = ["n", "v", "adj", "adv"], J = JSON.stringify;
const days = [], bn = {}, bt = {}, ex = {}, bad = [], reused = [];
files.forEach(f => {
  let n, t, s, b, g = [], cur = null;
  fs.readFileSync(path.join(srcDir, f), "utf8").split("\n").filter(x => x.trim()).forEach(l => {
    if (l.startsWith("N: ")) n = +l.slice(3);
    else if (l.startsWith("T: ")) t = l.slice(3);
    else if (l.startsWith("S: ")) s = l.slice(3);
    else if (l.startsWith("B: ")) b = l.slice(3);
    else if (l.startsWith("# ")) { cur = [l.slice(2), []]; g.push(cur); }
    else {
      const p = l.split("|");
      if (p.length !== 5) { bad.push(f + " bad row: " + l.slice(0, 40)); return; }
      const [w, pos, en, bnv, exs] = p, k = w.toLowerCase();
      if (!POS.includes(pos)) bad.push(f + " pos: " + w);
      const m = exs.match(/\*([^*]+)\*/);
      if (!m || !m[1].toLowerCase().startsWith(k.slice(0, 3))) bad.push(f + " example needs the *starred* word: " + w);
      cur[1].push(w[0].toUpperCase() + w.slice(1) + "|" + pos + "|" + en);
      if (known[k]) { reused.push(n + ":" + k); return; }
      known[k] = 1; bn[k] = bnv; ex[k] = exs;
    }
  });
  if (!n || !t || !s || !b) bad.push(f + ": missing N/T/S/B");
  days.push({ n, t, pg: n, s, g }); bt[n] = b;
});
if (bad.length) { console.error("PROBLEMS:\n" + bad.join("\n")); process.exit(1); }
if (reused.length) console.log("reused " + reused.length + " words already defined elsewhere (their meanings and examples are kept)");
const first = days[0].n, last = days[days.length - 1].n;
let out = `/* Pack: days ${first} to ${last}. One pack = one delivery of book pages. */\n(window.VB_PACKS = window.VB_PACKS || []).push({\n\ndays: [\n`;
out += days.map(d => "{n:" + d.n + ", t:" + J(d.t) + ", pg:" + d.pg + ",\ns:" + J(d.s) + ",\ng:[\n" + d.g.map(x => J(x)).join(",\n") + "\n]}").join(",\n\n");
out += "\n],\n\nbn: {\n" + Object.entries(bn).map(([k, v]) => J(k) + ":" + J(v)).join(",\n") + "\n},\n\nbt: {\n" + Object.entries(bt).map(([k, v]) => J(k) + ":" + J(v)).join(",\n") + "\n},\n\nex: {\n" + Object.entries(ex).map(([k, v]) => J(k) + ":" + J(v)).join(",\n") + "\n}\n\n});\n";
fs.writeFileSync(outFile, out);
console.log(`${outFile}: ${days.length} pages (${first}-${last}), ${Object.keys(bn).length} new words`);
