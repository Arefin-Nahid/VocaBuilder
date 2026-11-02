#!/usr/bin/env node
/* After adding or removing a pack file in js/data/, run:  node tools/update-packs.js
   It lists every js/data/pack-*.js in index.html and sw.js (and refreshes the offline cache name), so you never edit those by hand. */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const packs = fs.readdirSync(path.join(root, "js/data")).filter(f => /^pack-.*\.js$/.test(f)).sort();
if (!packs.length) { console.error("No pack files found in js/data/"); process.exit(1); }

function patch(file, re, fn) {
  const p = path.join(root, file);
  const s = fs.readFileSync(p, "utf8");
  if (!re.test(s)) { console.error(`${file}: marker block not found`); process.exit(1); }
  fs.writeFileSync(p, s.replace(re, fn));
}
patch("index.html", /([ \t]*)<!-- PACKS:START -->[\s\S]*?<!-- PACKS:END -->/, (m, ind) =>
  `${ind}<!-- PACKS:START -->\n` + packs.map(f => `${ind}<script src="js/data/${f}"></script>`).join("\n") + `\n${ind}<!-- PACKS:END -->`);
patch("sw.js", /([ \t]*)\/\* PACKS:START \*\/[\s\S]*?\/\* PACKS:END \*\//, (m, ind) =>
  `${ind}/* PACKS:START */\n` + packs.map(f => `${ind}"js/data/${f}",`).join("\n") + `\n${ind}/* PACKS:END */`);
const stamp = new Date().toISOString().slice(0, 16).replace(/\D/g, "");
patch("sw.js", /const CACHE = "[^"]*";( \/\* CACHE \*\/)?/, () => `const CACHE = "vocabuilder-${stamp}"; /* CACHE */`);
console.log("Listed " + packs.length + " pack(s): " + packs.join(", "));
