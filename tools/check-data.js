#!/usr/bin/env node
/* Sanity-checks the vocabulary data. Run:  node tools/check-data.js
   - no day number appears in two packs; packs are listed in index.html
   - every highlighted (*starred*) story word matches an entry of that day
   - every word has a Bangla meaning, and every day has a Bangla story translation
   - every data row looks like "Word|pos|meaning" with a known part of speech */
const fs = require("fs"), path = require("path"), vm = require("vm");
global.window = global; global.document = {};
const root = path.join(__dirname, "..");
const load = f => vm.runInThisContext(fs.readFileSync(path.join(root, f), "utf8"), { filename: f });
const packFiles = fs.readdirSync(path.join(root, "js/data")).filter(f => /^pack-.*\.js$/.test(f)).sort();
packFiles.forEach(f => load("js/data/" + f));
["config", "utils", "calendar", "store", "vocab"].forEach(m => load("js/core/" + m + ".js"));
const { DAYS, ENT, BN, BT, findEntry, example } = VB.vocab;
const POS = new Set(["n", "v", "adj", "adv"]);
let problems = [];
// A day number defined in two packs means one silently replaces the other.
const seenDay = {};
(window.VB_PACKS || []).forEach((p, i) => (p.days || []).forEach(d => { if (seenDay[d.n] !== undefined) problems.push(`day ${d.n}: defined in more than one pack (${packFiles[seenDay[d.n]]} and ${packFiles[i]})`); seenDay[d.n] = i; }));
// The packs listed in index.html must match the files on disk (run tools/update-packs.js to fix).
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
packFiles.forEach(f => { if (html.indexOf("js/data/" + f) < 0) problems.push(`${f} is not listed in index.html. Run: node tools/update-packs.js`); });
DAYS.forEach(d => {
  (d.s.match(/\*([^*]+)\*/g) || []).forEach(m => { const w = m.slice(1, -1).toLowerCase(); if (!findEntry(d.n, w)) problems.push(`day ${d.n}: highlighted "${w}" has no entry`); });
  d.g.forEach(g => g[1].forEach(r => { const p = r.split("|"); if (p.length !== 3 || !POS.has(p[1]) || !p[2]) problems.push(`day ${d.n}: bad row "${r}"`); }));
  if (!BT[d.n]) problems.push(`day ${d.n}: missing Bangla story translation`);
  ENT[d.n].forEach(e => {
    if (!BN[e.k]) problems.push(`day ${d.n}: "${e.k}" missing Bangla meaning`);
    const ex = example(e);
    if (!ex) problems.push(`day ${d.n}: "${e.k}" missing example sentence`);
    else if (!/\*[^*]+\*/.test(ex)) problems.push(`day ${d.n}: "${e.k}" example has no *starred* word`);
  });
});
const gaps = []; for (let i = 1; i < DAYS.length; i++) if (DAYS[i].n - DAYS[i - 1].n > 1) gaps.push(`${DAYS[i - 1].n}-${DAYS[i].n}`);
if (gaps.length) console.log("note: gap(s) in day numbers: " + gaps.join(", "));
const unique = new Set(); DAYS.forEach(d => ENT[d.n].forEach(e => unique.add(e.k)));
console.log(`${DAYS.length} days, ${unique.size} unique words, ${Object.keys(BN).length} Bangla meanings`);
if (problems.length) { console.log(problems.join("\n")); process.exit(1); }
console.log("data OK");
