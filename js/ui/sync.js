/* Account button (top right): a round Google icon. Signed out, tap it to sign in; signed in, it shows your photo
   and opens a small card with the sync status, Sync now and Sign out. */
(function () {
  "use strict";
  var VB = window.VB, $ = VB.utils.$, esc = VB.utils.esc, open = false;

  var G = '<svg viewBox="0 0 48 48" width="17" height="17" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  function ago(t) {
    if (!t) return "";
    var s = Math.round((Date.now() - t) / 1000);
    if (s < 10) return "just now";
    if (s < 60) return s + " seconds ago";
    var m = Math.round(s / 60);
    return m < 60 ? m + (m === 1 ? " minute ago" : " minutes ago") : new Date(t).toLocaleString();
  }

  function avatar(U, big) {
    var size = big ? 48 : 32;
    if (U.photo) return '<img class="av" src="' + esc(U.photo) + '" alt="" referrerpolicy="no-referrer" width="' + size + '" height="' + size + '">';
    return '<span class="av ini">' + esc((U.name || U.email || "?").charAt(0).toUpperCase()) + "</span>";
  }

  function render() {
    var el = $("acct"), Y = VB.sync.Y, U = Y.user, h;
    if (!el) return;
    var dot = Y.status === "syncing" || Y.status === "loading" ? "busy" : Y.status === "synced" ? "ok" : Y.status === "error" ? "err" : "off";
    if (U) {
      h = '<button class="acb" data-act="acct" aria-haspopup="dialog" aria-expanded="' + open + '" aria-label="Account: ' + esc(U.name || U.email) + '">' + avatar(U) + '<i class="sd ' + dot + '"></i></button>';
      if (open) {
        var txt = Y.status === "syncing" ? "Syncing…" : Y.status === "error" ? "Not synced" : Y.status === "offline" ? "Offline. Will sync later" : "Synced across your devices" + (Y.last ? " · " + ago(Y.last) : "");
        h += '<div class="pop" role="dialog" aria-label="Account"><div class="pop-who">' + avatar(U, true) + "<div><b>" + esc(U.name || "Signed in") + "</b><span>" + esc(U.email) + "</span></div></div>"
          + '<div class="pop-st"><i class="sd ' + dot + '"></i>' + txt + "</div>"
          + (Y.error ? '<p class="pop-err">' + esc(Y.error) + "</p>" : "")
          + '<div class="pop-b"><button class="btn" data-act="syncNow"' + (Y.status === "syncing" ? " disabled" : "") + '>Sync now</button><button class="btn out" data-act="signOut">Sign out</button></div></div>';
      }
    } else {
      h = '<button class="acb g" data-act="' + (Y.status === "unavailable" ? "acct" : "signIn") + '" aria-label="Sign in with Google" title="Sign in with Google">' + G + "</button>";
      if (open) h += '<div class="pop"><p class="pop-t">Sign in with Google to sync your progress between devices.</p><p class="pop-err" style="background:var(--bg);color:var(--muted)">Sign-in works on your published website (GitHub Pages), not in this preview.</p></div>';
    }
    if (!U && Y.error) h += '<div class="pop"><p class="pop-err">' + esc(Y.error) + "</p></div>";
    el.innerHTML = h;
  }

  function toggle() { open = !open; render(); }
  function close() { if (open) { open = false; render(); } }

  VB.ui.sync = { render: render, toggle: toggle, close: close };
  VB.sync.onChange(function () { render(); });
})();
