# VocaBuilder app: full project context (hand this file to Claude with the code)

Purpose of this file: give a new Claude session everything needed to continue the project, especially how to **add new pages of words** in exactly the same style as before. Give Claude this file, the project zip, and the new PDF pages, then say "add these pages". Claude should follow sections 5 to 9 literally.

---

## 1. What the project is
- A personal study web app made by **Nahid** (KUET student) from the scanned book **VocaBuilder 3.0** by **Farhad Hossain Masum** (Adarsha), www.vocabuilder.rocks.
- Static site on **GitHub Pages**: `https://arefin-nahid.github.io/VocaBuilder/`. Installable (PWA), works offline, no build step, no framework.
- It grows in batches: Nahid sends a PDF of scanned book pages; Claude transcribes them into a new "pack"; Nahid unzips the project and pushes it to GitHub.
- Each book page becomes one **page/lesson** in the app. Each lesson has: a story using the page's words (highlighted), grouped word meanings (with part of speech), Bangla meanings, a Bangla translation of the story, one English example sentence per word, listen (TTS) buttons, a quiz, and spaced-repetition review.
- A published Claude artifact (a single-file build) also exists for preview. Sync/sign-in only works on the GitHub Pages site, not in the artifact.

## 2. Current content state
- **83 pages, 2085 unique words**, in four packs:
  - `js/data/pack-001-030.js` pages 1-30 (book pp. 9-38)
  - `js/data/pack-031-042.js` pages 31-42 (book pp. 39-50)
  - `js/data/pack-043-067.js` pages 43-67 (book pp. 51-75) (built from `tools/source/pack-043-067/*.txt`)
  - `js/data/pack-068-083.js` pages 68-83 (book pp. 76-91) (built from `tools/source/pack-068-083/*.txt`)
- Rule: **page number n = book page n + 8**. The next pack starts at **page 68 = book page 76**.
- Page titles so far (a title ending "(continued)" joins the previous head word):
  1 Abandon; 2 Abundance and Scarcity; 3-4 Add and Subtract; 5 Agreement or Argument; 6 Agree, Argue, Cancel; 7 Consensus and Synergy; 8-9 Animal Planet; 10-11 Beauty and Ugly; 12 Beg Pardon; 13 Calm and Angry; 14-15 Angry; 16-17 Care and Seriousness; 18-19 Clever and Stupid; 20 Cloth; 21 Colors; 22-23 Criticism; 24-26 Economics; 27-28 Environment; 29-30 Fear and Courage; 31 Flattery; 32-34 Food; 35-37 Form and Shape; 38 Friends; 39-40 Geography; 41-42 Government and Politics; 43-46 Happy and Gloomy; 47-48 Hate and Inclination; 49-50 Hesitation and Frustration; 51-52 Insult and Praise; 53 Introduction; 54 Laughter and Humor; 55-57 Law; 58-60 Life and Death; 61-64 Literature, Art and Music; 65-66 Loyalty and Cheating; 67 Luck by Chance; 68-69 Marriage and Family; 70-74 Medical Terms; 75 Memory and Metals; 76 Mimic; 77 Mind; 78-80 Motions; 81 Name; 82 Newer and Older, Odor; 83 Normal/Abnormal. Next pack starts at page 84 (book p. 92).
- Book chapters are alphabetical by head word, which is why the app's lesson order and Index are A-Z.

## 3. Hard rules and preferences from Nahid (never break these)
1. **Phone (Android) view is perfect. Do not change it** unless asked. The desktop "wide screen" draft was rejected; keep the single-column layout.
2. The word **"Day" must not appear in the UI**. Use head-word titles ("Food", "Part 2").
3. **Index is A-Z only** (head words), no book order. Lesson order (Up next, arrows, quiz ranges) is alphabetical by head word.
4. **No "X of Y finished" totals** and no greyed-out future items.
5. Quiz progress is a plain segmented bar (no red/green segments); Review gaps are fixed: Forgot = tomorrow, Hard = 3 days, Got it = 7 days (config.gaps); box tiles read "Box 1".."Box 5".
6. Top bar stays slim (logo, "Word of the day", date, Google icon). Headings are one size smaller than the original.
7. Give a **flat zip** (files at the root, no outer folder, no `dist/`) he can unzip and push, plus an updated preview artifact. Do not paste the artifact URL; keep replies short and plain.
8. Do not read or write the claude.ai Project "BCS Journey".
9. Acknowledgement text must stay justified and credit the book.

## 4. Architecture (plain scripts, `window.VB` namespace)
```
index.html            shell; script order; <!-- PACKS:START/END --> block is managed by tools/update-packs.js
sw.js, js/pwa.js      service worker (network-first, cache fallback); PRECACHE list + cache name stamped by update-packs
manifest.webmanifest  install settings; icons in icons/ (favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192/512/maskable)
css/                  tokens, base, layout (sticky header, tabs), lesson, components, vocabulary, quiz-review, index, responsive, theme-mint
js/data/pack-*.js     content (see section 5)
js/core/              config, utils, calendar, firebase-config, store, vocab, progress, srs, speech, sync
js/ui/                header, learn, quiz, review, index, about, sync (account button)
js/app.js             router (#day-N, #day-N-quiz, #review, #index, #about) and click actions (data-act="...")
firebase/firestore.rules, FIREBASE-SETUP.md   cloud sync setup
tools/                update-packs.js, check-data.js, build-pack.js, build-single-file.js, source/ (page text files)
```
Key behaviour:
- `vocab.js` merges all packs: DAYS, head words (a "(continued)" page joins the head word with the same base title), alphabetical lesson order `nums`, `pos(n)`, `neighbor(n,dir)`, `findEntry` (exact match, then stem of at least 4 letters, then 3-letter doubling such as don -> donned), `BN`, `BT`, `EX`.
- Storage key `vb30-v2` (localStorage): `done`, `srs`, `quiz`, `active`, `bnStory`, `bnWords`, `bnFull`, `showEx`, plus `m` (per-item change time stamps for sync).
- SRS = Leitner boxes with gaps 1, 2, 4, 8, 16 days. Quiz = 10 questions per page (4 fill-the-blank, then meanings in English/Bangla), mixed quiz = 15 questions over a range.
- **Sync:** Google sign-in + Firestore document `users/{uid}`; items merged one by one, newest change wins; live listener; runs only on `VB.syncHosts` (GitHub Pages host, localhost). Firebase SDK (compat, v10.14.1) is loaded on demand. Real sign-in could not be tested by Claude (no access to Google from the build sandbox); Nahid confirmed it works.
- Word of the day: chosen from the sorted word list by the calendar date, so all devices agree.

## 5. Pack data format (exact)
```js
(window.VB_PACKS = window.VB_PACKS || []).push({
  days: [ { n: 68, t: "Title", pg: 68,
            s: "Story with *starred* words.",
            g: [ ["Group name", ["Word|pos|English meaning", "..."]] ] } ],
  bn: { "word": "বাংলা অর্থ" },                       // key = lowercase head word
  bt: { "68": "গল্পের বাংলা অনুবাদ" },                  // key = page number
  ex: { "word": "Example sentence with the *word* starred." }  // key = word, or "word|pos" when one word has two parts of speech
});
```
- Rows: `Word|pos|English`, `pos` in `n`, `v`, `adj`, `adv`. First letter of the display word is capitalised; keys are lowercase.
- A word already defined in an earlier pack is still listed in its group on the new page, but `bn`/`ex` are **not redefined** (the builder reuses them).
- Page numbers must be unique across packs. A page titled `"X (continued)"` joins head word X.

## 6. Workflow for adding new pages (do exactly this)
1. Read the new PDF pages (Read tool, `pages` parameter, 4-5 pages per call). Each scan is one book page; page n = book page - 8.
2. For each page write `tools/source/pack-XXX-YYY/dNN.txt` in the compact format below, **right after reading the page** (do not postpone).
3. Build: `node tools/build-pack.js tools/source/pack-XXX-YYY js/data/pack-XXX-YYY.js`
4. Register and validate: `node tools/update-packs.js && node tools/check-data.js` (must print "data OK").
5. Fix reported problems (typical: a starred story word with no matching row, example without the starred word).
6. Run the Playwright regression tests if available (all page quizzes, Index/order, no console errors), look at screenshots for any UI change.
7. Rebuild the single file for the preview: `node tools/build-single-file.js` and `node tools/build-single-file.js --fragment` (the fragment is what the artifact uses; forgetting `--fragment` publishes stale data).
8. Zip the project **without `dist/`**, flat at the root; publish `dist/vocabuilder.fragment.html` to the existing artifact; send the zip.
9. Update the page list in section 2 of this file and the README pack list.

Compact page file format:
```
N: 68
T: Title
S: Story using the page's words, with *starred* words.
B: বাংলা অনুবাদ
# Group name
word|pos|English meaning|Bangla meaning|Example sentence with the *word* starred.
```
Group names come from the book's boxes (for example "Insult (verb)", "Praise (noun)", "Words of blame and praise").

## 7. How to transcribe the book page (what goes in the rows)
- The book page shows boxes: a headline meaning ("Violation of a law [n] = আইন বা আদেশ লঙ্ঘন") followed by synonym lines (-Transgression, -Infraction) and arrow items (`➤ Transgress [v] = violate a law; to trespass; আইন লঙ্ঘন করা`).
- **Every word on the page becomes a row**: synonym-list words, arrow items, and words inside example paragraphs marked in bold. Slash pairs like "Autopsy / Necropsy" become two rows. Words that appear in the book's own "Combined Context" paragraph are included too.
- Part of speech comes from the book's `[n]`, `[v]`, `[adj]`, `[adv]` tag; for synonym lists use the headline's tag.
- The group name is the box headline ("Imprison", "Charge in court", "Beginning and ending").
- **English meaning** (3rd field): the book's gloss, shortened and cleaned: lower case, no final period, about 2-8 words, `;` between senses ("buried; place in a grave or tomb"). If the book gives no gloss for a synonym, write a short accurate definition of the sense used on that page.
- If the book prints a second sense ("also living and breathing", "also humorous"), keep it after a `;`.

## 8. How the story ("context text") and its Bangla translation are made
Purpose: a story gives the words a memory context; Nahid reads the highlighted words inside a narrative.
- **One story per page** (5-9 sentences, about 70-130 words), a small coherent scene tied to the page's head word. Humour, a named character, or a real or quasi-historical example is welcome (past pages used the Boromir ring story, Leonardo da Vinci, Heath Ledger style hooks from the book's own "Combined Context").
- **Use as many of the page's words as the story can carry naturally** (aim for all of them on short pages, most of them on long pages). Each used word is wrapped in `*stars*`. The story must still read as sensible English.
- A starred word may be inflected (`*rued*`, `*feigns*`) **only if the stem still matches a row** under the app's matching rule (exact, or the same first >= 4 letters, or doubling). When in doubt, star the base form, and make sure the row exists. `check-data.js` fails on a starred word with no entry (it caught `rued` and `disloyal` before; fix by starring `rue` or adding the row).
- Keep words in their right sense (do not star "rider" in a non-legal sense on the Law page).
- Do not copy the book's example paragraphs verbatim; paraphrase or write original text (the stories are the app author's own additions).
- If the book itself has a "Combined Context" paragraph, use it as inspiration for the story's idea but write an original story.
- **Bangla story translation (`B:`)**: a full, natural Bangla rendering of the whole story (not word by word), written in standard Bangla (cholito), keeping the sentences in the same order. Where a starred word occurs, the translation uses that word's Bangla meaning so the reader can match them. Names stay as in English or are transliterated. No English words left in the Bangla unless a proper noun.

## 9. Bangla meanings and English example sentences (rules)
**Bangla meaning (4th field, `bn`):**
1. If the book prints a Bangla gloss for the word, use it (fix obvious typos, keep its wording). This is the first choice.
2. Otherwise write your own accurate, concise Bangla: 1-6 words, the commonest sense for that part of speech.
3. Several senses are separated with `; ` (example: `অবনত করা; নিচু করা`). Put the sense used in the book page first.
4. Match the part of speech: verbs end like verbs (`করা`, `হওয়া`), adjectives are adjective-like (`বিশ্বস্ত`), nouns are nouns.
5. Do not simply transliterate the English word. Do not repeat the English meaning. Words with a Bangla-world meaning keep it (`রাজাকার` for quisling, as the book gives).
6. Reuse the exact same Bangla for the same word wherever it appears (the app has one `bn` per word).

**English example sentence (5th field, `ex`):**
1. **One original sentence per word**, 6-14 words, plain everyday English that a learner can understand without a dictionary. Never copy the book's example.
2. It must **show the word in a typical natural use** (typical collocation or situation), not a definition. Wrong: "Abase means to lower someone." Right: "He refused to *abase* himself before the king."
3. The word appears **exactly once, starred**, in the form that fits the sentence (inflection allowed: `*abandoned*`, `*lauds*`). `check-data.js` verifies a starred word exists.
4. Match the row's part of speech and the sense used on the page (for example `felony` = serious crime, not just any crime).
5. Neutral, family-friendly, no real private individuals, no politics. Vary subjects and settings (school, office, village, travel, nature, family) so the sentences do not feel repetitive.
6. If a word needs two senses or parts of speech, key it as `word|pos` in `ex` (rare).
7. Examples are shown/hidden by the **Sentences** switch; keep them short enough to fit a phone line.

## 10. Validation and QA that must pass
- `node tools/check-data.js`: all starred story words have entries; every word has Bangla meaning and example with a starred word; no duplicate pages; prints "data OK" with counts.
- `node tools/build-pack.js` rejects rows with the wrong field count, bad `pos`, or an example without the starred word.
- Browser tests (Playwright, any file under scratchpad is disposable): open every page's quiz and finish it (result screen shows `.ring`), check the Index (A-Z, search), order (alphabetical neighbours), phone widths 320-412 with no horizontal overflow, and no console errors. Look at screenshots for UI changes.
- Spot-check 10 random new words: meaning matches the book, Bangla is correct, sentence uses the word naturally.

## 11. Release checklist (what Nahid receives)
1. Flat zip of the project without `dist/` (`zip -qr vocabuilder-30.zip . -x 'dist/*'` from the project root).
2. Updated preview artifact: build `dist/vocabuilder.fragment.html` with `--fragment`, then publish it to the existing artifact (same URL).
3. A short summary: pages added, word count, what else changed. Mention to delete removed files from the repository when files were moved or renamed.
4. After pushing, the installed phone app updates the next time it opens online.

## 12. Known pitfalls
- Published the wrong build once (non-fragment) so the artifact showed old data: always use `--fragment` for the artifact.
- `ixopen` crash when a chip had no word: highlight only if `data-w` exists.
- Mixed quiz could stay open when jumping to another page: `go()` and `fromHash` clear the quiz.
- Long titles overflowed the quiz top bar: title uses ellipsis, progress strip uses `min-width:0`.
- CSS edits once deleted the `.score` style; the Review count uses `.score`.
- Moving icons requires updating `index.html`, `manifest.webmanifest`, `sw.js` and `tools/build-single-file.js` together.
- The shell sandbox cannot reach Google, so Firebase sign-in cannot be tested by Claude.

## 13. Copy-paste prompt for the next update
> Here is the project zip and `CONTEXT.md`. I attached the next PDF pages (book pages 76-100). Add them as pages 68-92 following CONTEXT.md sections 5-11: transcribe every word, write a story and Bangla translation per page, a Bangla meaning and a new English example sentence for each word, build the pack with `tools/build-pack.js`, run the checks and tests, then give me the flat zip and update the preview.
