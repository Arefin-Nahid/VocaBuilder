#!/usr/bin/env node
/* Bundles the whole app into ONE html file (inline CSS + JS).
   Usage:  node tools/build-single-file.js            -> dist/vocabuilder.html (full page)
           node tools/build-single-file.js --fragment -> dist/vocabuilder.fragment.html (no <html>/<head>, for embeds) */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const fragment = process.argv.includes("--fragment");
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");

html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">\s*/g, () => "");
// the single file is not installable: drop the manifest link and the service-worker script
html = html.replace(/\s*<link rel="manifest"[^>]*>/, "").replace(/\s*<script src="js\/pwa.js"><\/script>/, "");
// inline the logo so the single file needs no other files
const svg64 = fs.readFileSync(path.join(root, "favicon.svg")).toString("base64");
const iconTag = `<link rel="icon" href="data:image/svg+xml;base64,${svg64}" type="image/svg+xml">`;
html = html.replace(/\s*<link rel="icon" href="favicon-32.png"[^>]*>/, "").replace(/\s*<link rel="apple-touch-icon"[^>]*>/, "")
  .replace(/<link rel="icon" href="favicon.svg"[^>]*>/, iconTag);
const css = [...fs.readFileSync(path.join(root, "index.html"), "utf8").matchAll(/href="(css\/[^"]+)"/g)]
  .map(m => fs.readFileSync(path.join(root, m[1]), "utf8")).join("\n");
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>\s*/g)];
const js = scripts.map(m => fs.readFileSync(path.join(root, m[1]), "utf8")).join("\n");
html = html.replace(/<script src="[^"]+"><\/script>\s*/g, "");
html = html.replace("</head>", `<style>\n${css}\n</style>\n</head>`).replace("</body>", `<script>\n${js}\n</script>\n</body>`);

if (fragment) {
  const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]+>/)[0];
  const style = html.match(/<style>[\s\S]*?<\/style>/)[0];
  const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
  html = `<title>VocaBuilder</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${iconTag}\n${fonts}\n${style}\n${body}`;
}
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const out = path.join(root, "dist", fragment ? "vocabuilder.fragment.html" : "vocabuilder.html");
fs.writeFileSync(out, html);
console.log("wrote", path.relative(root, out), (html.length / 1024).toFixed(0) + " KB");
