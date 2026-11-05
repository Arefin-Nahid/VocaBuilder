# VocaBuilder

An offline-first vocabulary app built from the book *VocaBuilder* by Farhad Hossain Masum. Each lesson has a short story with highlighted words, grouped meanings (English and Bangla), a Bangla story translation, example sentences, a quiz and spaced-repetition review.

Plain HTML, CSS and JavaScript. No framework, no build step, and no server. Installable on a phone (PWA).

## Features
- **Learn:** story, word groups, Bangla toggles, listen buttons, example sentences.
- **Quiz:** a quiz per page, or a mixed quiz over any range of pages.
- **Review:** Leitner boxes with gaps of 1, 2, 4, 8 and 16 days.
- **Index:** head words A–Z with search across every word.
- **Word of the day** and today's date in the top bar.
- **Cloud sync** (optional): Google sign-in and Firestore keep progress the same on every device.
- Works offline once opened; progress is saved in the browser.

## Publish (GitHub Pages)
1. Put all files at the repository root (`index.html` next to `sw.js`) and push.
2. Settings > Pages > Deploy from a branch > `main` / root.
3. Open the link on your phone and choose **Install app**. New versions load the next time you open it online.

Opening `index.html` from disk also works (without offline install and sync).

## Cloud sync
Firebase settings are in `js/core/firebase-config.js`. One-time console steps (authorized domain, Firestore rules) are in `FIREBASE-SETUP.md`. Rules are in `firebase/firestore.rules`. Sync runs only on the hosts listed in `VB.syncHosts`.

## Structure
```
index.html          page shell and script order
sw.js, js/pwa.js    offline support
css/                styles (tokens, layout, lesson, quiz-review, index ...)
js/data/            content packs, one file per batch of pages
js/core/            logic: store, vocab, srs, progress, speech, sync, config
js/ui/              screens: header, learn, quiz, review, index, about, sync
js/app.js           router and click actions
tools/              update-packs.js, check-data.js, build-single-file.js
firebase/           Firestore rules
```
Scripts share one `VB` namespace (plain files, no modules).

## Add new pages
1. Create `js/data/pack-XXX-YYY.js`:
```js
(window.VB_PACKS = window.VB_PACKS || []).push({
  days: [{ n: 68, t: "Title", pg: 68, s: "Story with *starred* words.",
           g: [["Group name", ["Word|pos|English meaning"]]] }],
  bn: { "word": "বাংলা অর্থ" },          // lowercase headword
  bt: { "68": "গল্পের বাংলা অনুবাদ" },     // story translation by page number
  ex: { "word": "Example with the *word* starred." }
});
```
`pos` is `n`, `v`, `adj` or `adv`. A page titled "Food (continued)" joins the head word "Food". Page numbers must be unique.

2. `node tools/update-packs.js` registers the pack in `index.html` and `sw.js` and refreshes the offline cache.
3. `node tools/check-data.js` validates highlights, meanings and sentences.
4. Commit and push.

`node tools/build-single-file.js` writes a one-file build to `dist/` (add `--fragment` for an embeddable version).

## Acknowledgement
Word lists, grouping and meanings come from *VocaBuilder* by Farhad Hossain Masum (Adarsha), www.vocabuilder.rocks. The stories, examples, Bangla translations and the app are separate additions for personal study, not an official product of the author or publisher.
