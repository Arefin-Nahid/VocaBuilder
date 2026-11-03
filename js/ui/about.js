/* About screen: why the app exists, what it is for, and the acknowledgement of the book it is based on. */
(function () {
  "use strict";
  var VB = window.VB, $ = VB.utils.$;

  function render() {
    $("view").innerHTML = '<div><div class="when">About this app</div><h1>Acknowledgement</h1></div>'
      + '<section class="card about">'
      + '<h2 class="label">Based on the book</h2>'
      + '<p>This app is based on <b>VocaBuilder</b> by <b>Farhad Hossain Masum</b> (Adarsha), a vocabulary book for GRE, GMAT, SAT, TOEFL, IELTS and BBA/MBA test takers. The head words, word groups and their meanings come from that book, page by page. All credit for the word lists and the way the words are grouped belongs to the author.</p>'
      + '<p class="muted">Book website: <a href="https://www.vocabuilder.rocks" target="_blank" rel="noopener">www.vocabuilder.rocks</a> · <a href="https://www.facebook.com/vocabuilder" target="_blank" rel="noopener">facebook.com/vocabuilder</a></p>'
      + "</section>"
      + '<section class="card about">'
      + '<h2 class="label">Why it was made</h2>'
      + "<p>I made this app for my own study. A printed book is hard to carry through a busy day, and long lists of words are easy to forget. I wanted to read the words inside a short story, hear them spoken, see them in a sentence, check the Bangla meaning, and then be tested again at the right time, all on my phone.</p>"
      + "</section>"
      + '<section class="card about">'
      + '<h2 class="label">How it helps</h2>'
      + '<ul class="about-list"><li><b>Story first.</b> Each page has a short story that uses its words, so they stay in memory with a context.</li>'
      + "<li><b>Bangla and English.</b> Every word has its meaning in both languages, an example sentence, and a listen button.</li>"
      + "<li><b>Practice.</b> Quizzes and a mixed quiz over many pages, plus spaced review that brings a word back just before you forget it.</li>"
      + "<li><b>Your own pace.</b> Progress follows the pages you finish, and the Index lets you jump to any head word.</li></ul>"
      + "</section>"
      + '<section class="card about">'
      + '<h2 class="label">What is original here</h2>'
      + "<p>The stories, example sentences, Bangla story translations and the app itself were written separately to help study the book. They are not part of the book and are not an official product of the author or publisher. This app is a study aid, not a replacement for the book. If it helps you, please get the book and support the author.</p>"
      + "</section>";
  }

  VB.ui.about = { render: render };
})();
