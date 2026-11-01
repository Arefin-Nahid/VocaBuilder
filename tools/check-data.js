#!/usr/bin/env node
/* Sanity-checks the vocabulary data. Run:  node tools/check-data.js
   - every highlighted (*starred*) story word matches an entry of that day
   - every word has a Bangla meaning, and every day has a Bangla story translation
   - every data row looks like "Word|pos|meaning" with a known part of speech */
const fs = require("fs"), path = require("path"), vm = require("vm");
global.window = global; global.document = {};
const root = path.join(__dirname, "..");
const load = f => vm.runInThisContext(fs.readFileSync(path.join(root, f), "utf8"), { filename: f });
fs.readdirSync(path.join(root, "js/data")).sort().forEach(f => load("js/data/" + f));
["config", "utils", "calendar", "store", "vocab"].forEach(m => load("js/core/" + m + ".js"));
const { DAYS, ENT, BN, BT, findEntry } = VB.vocab;
const POS = new Set(["n", "v", "adj", "adv"]);
let problems = [];
DAYS.forEach(d => {
  (d.s.match(/\*([^*]+)\*/g) || []).forEach(m => { const w = m.slice(1, -1).toLowerCase(); if (!findEntry(d.n, w)) problems.push(`day ${d.n}: highlighted "${w}" has no entry`); });
  d.g.forEach(g => g[1].forEach(r => { const p = r.split("|"); if (p.length !== 3 || !POS.has(p[1]) || !p[2]) problems.push(`day ${d.n}: bad row "${r}"`); }));
  if (!BT[d.n]) problems.push(`day ${d.n}: missing Bangla story translation`);
  ENT[d.n].forEach(e => { if (!BN[e.k]) problems.push(`day ${d.n}: "${e.k}" missing Bangla meaning`); });
});
const unique = new Set(); DAYS.forEach(d => ENT[d.n].forEach(e => unique.add(e.k)));
console.log(`${DAYS.length} days, ${unique.size} unique words, ${Object.keys(BN).length} Bangla meanings`);
if (problems.length) { console.log(problems.join("\n")); process.exit(1); }
console.log("data OK");
