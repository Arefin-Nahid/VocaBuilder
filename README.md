# VocaBuilder

A 30-day vocabulary study plan (1–30 November 2026). Each day has one short story that uses that day's words, grouped word meanings with part of speech, Bangla meanings, a full Bangla translation of the story, a quiz and spaced-repetition review. Progress is saved in the browser; there is no server and no build step.

## Run it

Open `index.html` in a browser, or host the folder on GitHub Pages (Settings → Pages → deploy from the `main` branch, root folder).

## Project layout

```
index.html            page shell + the ordered list of scripts
css/
  tokens.css          colours, fonts (CSS variables)
  base.css            reset and page basics
  layout.css          sticky day bar, tabs, day picker
  lesson.css          lesson title, Context card, story, Bangla translation
  components.css      buttons, action bar, progress bar
  vocabulary.css      vocabulary groups and word rows
  quiz-review.css     quiz and review screens
  responsive.css      small-screen and reduced-motion rules
  theme-mint.css      mint colour overrides
js/
  data/               the content (edit words here)
    days-*.js           stories + word groups, 5 days per file
    bangla-words-*.js   Bangla meaning for each word
    bangla-stories-*.js Bangla translation of each day's story
  core/               logic with no DOM
    config.js  utils.js  calendar.js  store.js  vocab.js  srs.js  speech.js
  ui/                 one file per screen
    header.js  learn.js  quiz.js  review.js
  app.js              router, click actions, start-up
tools/
  check-data.js         node tools/check-data.js          (validates the data)
  build-single-file.js  node tools/build-single-file.js   (one-file build in dist/)
```

Scripts are plain (non-module) files that share one `VB` namespace, so the app also works when `index.html` is opened directly from disk.

## Data format

A day in `days-*.js`:

```js
{n:1, t:"Abandon", pg:1,
 s:"The old coach chose to *abdicate*. ...",      // *starred* words are highlighted
 g:[ ["Give up", ["Abandon|v|give up completely", "Abdicate|v|formally give up a throne"]] ]}
```

Each row is `Word|pos|English meaning` (`pos` is `n`, `v`, `adj` or `adv`). The Bangla meaning goes in `bangla-words-*.js` under the lowercase word. Run `node tools/check-data.js` after editing.

## Study method

Active recall (Recall mode), a quiz that mixes fill-the-blank and meaning questions, and Leitner spaced review with gaps of 1, 2, 4, 8 and 16 days.
