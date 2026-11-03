# VocaBuilder

A vocabulary study app for the whole VocaBuilder book, added a few pages at a time. A "Day" is one book page. Each day has one short story that uses that day's words, grouped word meanings with part of speech, Bangla meanings, a full Bangla translation of the story, a quiz and spaced-repetition review. The header shows the head word of the page (for example "Food"); tap it to open the **Index** of head words, each linking to its pages (A–Z, with search that also finds any word inside). There is also a **mixed quiz** over any range of days. Progress is by lesson, not by calendar: the app always opens on the first day you have not finished. Progress is saved in the browser; there is no server and no build step.

## Publish on GitHub Pages

1. Put all these files at the **root** of your repository (so `index.html` is next to `sw.js`), then commit and push.
2. Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)` → Save.
3. Open the Pages link on your phone.

You can also open `index.html` straight from disk to try it (the offline/install features only work from the https link).

## Install on a phone

Open the Pages link in Chrome → ⋮ menu → **Install app** (or *Add to Home screen*). After the first visit the app also opens offline.
If you installed an older shortcut before, remove it from the home screen first, then install again.

When you push a new version, the app picks it up the next time it is opened with internet.

## Project layout

```
index.html            page shell + the ordered list of scripts
favicon.svg, favicon-32.png, apple-touch-icon.png   the logo (browser tab)
manifest.webmanifest  icons/   install-to-phone settings and app icons
sw.js  js/pwa.js      offline support (service worker)
css/
  tokens.css          colours, fonts (CSS variables)
  base.css            reset and page basics
  layout.css          sticky day bar, tabs, day picker
  lesson.css          lesson title, Context card, story, Bangla translation
  components.css      buttons, action bar, progress bar
  vocabulary.css      vocabulary groups and word rows
  quiz-review.css     quiz and review screens
  index.css           Index screen and mixed-quiz picker
  responsive.css      small-screen and reduced-motion rules
  theme-mint.css      mint colour overrides
js/
  data/               the content: one "pack" file per delivery of pages
    pack-001-030.js     pages 1-30: stories, word groups, Bangla meanings,
                        Bangla story translations, example sentences
    pack-031-042.js     pages 31-42 (book pages 39-50)
    pack-043-067.js     pages 43-67 (book pages 51-75)
  core/               logic with no DOM
    config.js  utils.js  calendar.js  store.js  vocab.js  progress.js  srs.js  speech.js
  ui/                 one file per screen
    header.js  learn.js  quiz.js  review.js  index.js
  app.js              router, click actions, start-up
tools/
  update-packs.js       node tools/update-packs.js        (lists new packs in index.html and sw.js)
  check-data.js         node tools/check-data.js          (validates the data)
  build-single-file.js  node tools/build-single-file.js   (one-file build in dist/)
```

Scripts are plain (non-module) files that share one `VB` namespace, so the app also works when `index.html` is opened directly from disk.

## Adding new pages (a new pack)

1. Create `js/data/pack-031-045.js` (name it after the days it holds). Copy the shape of `pack-001-030.js`:

```js
(window.VB_PACKS = window.VB_PACKS || []).push({
  days: [ {n:31, t:"Title", pg:31, s:"Story with *starred* words.", g:[ ["Group name", ["Word|pos|English meaning", "..."]] ]} ],
  bn:   { "word": "বাংলা অর্থ" },        // lowercase headword
  bt:   { "31": "গল্পের বাংলা অনুবাদ" },   // by day number
  ex:   { "word": "Example with the *word* starred." }   // "word|pos" if one word has two parts of speech
});
```

   A pack can hold any number of pages. A page titled "Food (continued)" joins the head word "Food" in the Index; give a new head word a new title. Day numbers must not repeat across packs.
2. Run `node tools/update-packs.js` (adds the file to `index.html` and `sw.js` and refreshes the offline cache).
3. Run `node tools/check-data.js` (checks highlights, Bangla meanings, sentences, duplicate days).
4. Commit and push.

Each row is `Word|pos|English meaning` (`pos` is `n`, `v`, `adj` or `adv`). Example sentences wrap the word in `*stars*` so it shows in bold; the **Sentences** switch in the Vocabulary section shows or hides them.

## Study method

Active recall (Recall mode), a quiz that mixes fill-the-blank and meaning questions, and Leitner spaced review with gaps of 1, 2, 4, 8 and 16 days.

## Acknowledgement

This app is based on the book **VocaBuilder** by **Farhad Hossain Masum** (Adarsha), www.vocabuilder.rocks. The head words, word groups and meanings come from the book; the stories, example sentences, Bangla story translations and the app are separate additions made as a personal study aid. It is not an official product of the author or publisher. The same text is shown in the app under "About & acknowledgement" (footer link on every screen).
