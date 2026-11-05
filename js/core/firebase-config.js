/* Firebase settings for cloud sync. These values are public by design (they only identify your project);
   what protects the data is the Firestore rules in firebase/firestore.rules. */
(function () {
  "use strict";
  var VB = (window.VB = window.VB || {});
  VB.firebaseConfig = {
    apiKey: "AIzaSyCDgxeEkMLme5nZRdENOer4ZNNcuTDYRa0",
    authDomain: "vocabuilder-9f92a.firebaseapp.com",
    projectId: "vocabuilder-9f92a",
    storageBucket: "vocabuilder-9f92a.firebasestorage.app",
    messagingSenderId: "515670040168",
    appId: "1:515670040168:web:dfa1407ca3625ad37f25dd",
    measurementId: "G-VH8SGLS6D0"
  };
  // Sync only runs on these sites (Google sign-in works only on domains listed in Firebase Authorized domains).
  VB.syncHosts = ["arefin-nahid.github.io", "localhost", "127.0.0.1"];
  VB.firebaseSdk = "10.14.1";
})();
