/* Cloud sync with Firebase (Google sign-in + Firestore). One document per user: users/{uid}.
   The app works exactly the same without it: everything is still kept in the browser, and sync only
   copies and merges that data between your devices. The Firebase SDK is loaded on demand, only when online. */
(function () {
  "use strict";
  var VB = window.VB;
  var fb = null, db = null, ref = null, unsub = null, timer = null, listeners = [], busy = false, again = false, started = false;
  var Y = { status: "off", user: null, last: 0, error: "" };

  function set(status, error) {
    Y.status = status; Y.error = error || "";
    listeners.forEach(function (f) { try { f(Y); } catch (e) {} });
  }

  function enabled() {
    return !!(VB.firebaseConfig && VB.syncHosts && VB.syncHosts.indexOf(location.hostname) >= 0 && /^https?:$/.test(location.protocol));
  }

  function loadScript(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = function () { bad(new Error("Could not load " + src)); };
      document.head.appendChild(s);
    });
  }

  function friendly(e) {
    var c = (e && e.code) || "";
    if (c === "auth/unauthorized-domain") return "This website is not in Firebase Authorized domains yet. Add " + location.hostname + " in Authentication > Settings.";
    if (c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request") return "";
    if (c === "auth/popup-blocked") return "The sign-in window was blocked. Allow pop-ups for this site and try again.";
    if (c === "auth/operation-not-allowed") return "Google sign-in is not enabled in the Firebase console.";
    if (c === "permission-denied" || c === "firestore/permission-denied") return "Firestore refused the request. Publish the rules from firebase/firestore.rules.";
    if (c === "unavailable" || c === "auth/network-request-failed") return "No connection right now. It will sync when you are online.";
    return (e && e.message) || "Something went wrong.";
  }

  function init() {
    if (started) return;
    if (!enabled()) { set("unavailable"); return; }
    if (!navigator.onLine) { set("offline"); return; }
    started = true;
    set("loading");
    var v = VB.firebaseSdk, base = "https://www.gstatic.com/firebasejs/" + v + "/";
    loadScript(base + "firebase-app-compat.js")
      .then(function () { return loadScript(base + "firebase-auth-compat.js"); })
      .then(function () { return loadScript(base + "firebase-firestore-compat.js"); })
      .then(function () {
        fb = window.firebase;
        if (!fb.apps.length) fb.initializeApp(VB.firebaseConfig);
        db = fb.firestore();
        fb.auth().onAuthStateChanged(onUser, function (e) { set("error", friendly(e)); });
      })
      .catch(function () { started = false; set("offline"); });
  }

  function onUser(user) {
    if (unsub) { unsub(); unsub = null; }
    Y.user = user ? { name: user.displayName || "", email: user.email || "", photo: user.photoURL || "" } : null;
    if (!user) { ref = null; set("signedout"); return; }
    ref = db.collection("users").doc(user.uid);
    set("syncing");
    // Live copy of the cloud document: a quiz finished on the laptop appears on the phone within seconds.
    unsub = ref.onSnapshot(function (snap) {
      if (snap.metadata.hasPendingWrites) return;
      var res = { changed: false, push: false };
      if (snap.exists) {
        try { res = VB.store.mergeRemote(JSON.parse(snap.data().state)); } catch (e) { set("error", "Cloud data could not be read."); return; }
      } else res.push = true; // first sign-in: upload what this device has
      if (res.changed) refresh();
      if (res.push) push(); else { Y.last = Date.now(); set("synced"); }
    }, function (e) { set("error", friendly(e)); });
  }

  // Redraw after data arrives, but never interrupt a quiz or review in progress.
  function refresh() {
    var st = VB.state;
    if (st.Q || st.R) { VB.ui.header.render(); return; }
    VB.render();
  }

  function push() {
    if (!ref) return Promise.resolve();
    if (busy) { again = true; return Promise.resolve(); }
    busy = true; set("syncing");
    var got = null;
    return db.runTransaction(function (t) {
      return t.get(ref).then(function (snap) {
        got = null;
        if (snap.exists) { try { got = VB.store.mergeRemote(JSON.parse(snap.data().state)); } catch (e) {} }
        t.set(ref, { state: VB.store.payload(), updated: fb.firestore.FieldValue.serverTimestamp(), v: 1 });
      });
    }).then(function () {
      if (got && got.changed) refresh();
      Y.last = Date.now(); set("synced");
    }).catch(function (e) {
      set(navigator.onLine ? "error" : "offline", friendly(e));
    }).then(function () {
      busy = false;
      if (again) { again = false; queue(); }
    });
  }

  // Called after every local save; uploads shortly after the last change.
  function queue() {
    if (!ref) return;
    clearTimeout(timer);
    timer = setTimeout(push, 1500);
  }

  function signIn() {
    if (!fb) { init(); return; }
    var provider = new fb.auth.GoogleAuthProvider();
    set("syncing");
    fb.auth().signInWithPopup(provider).catch(function (e) { set(Y.user ? "synced" : "signedout", friendly(e)); });
  }
  function signOut() { if (fb) fb.auth().signOut(); }
  function syncNow() { if (ref) { clearTimeout(timer); push(); } else init(); }
  function onChange(f) { listeners.push(f); }

  window.addEventListener("online", function () { if (!started) init(); else if (ref) queue(); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && ref && Y.status !== "syncing") queue(); });

  VB.sync = { Y: Y, enabled: enabled, init: init, signIn: signIn, signOut: signOut, syncNow: syncNow, queue: queue, onChange: onChange };
})();
