// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, ref, set, push, onValue, off, update, remove } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Config is provided by a local, git-ignored file that sets window.FIREBASE_CONFIG
// This keeps keys out of the repo. See firebaseConfig.template.js for an example.
let app; let analytics; let auth; let firestore; let rtdb;
try {
  const cfg = (typeof window !== 'undefined' && window.FIREBASE_CONFIG) ? window.FIREBASE_CONFIG : null;
  if (!cfg || !cfg.apiKey) throw new Error('Missing FIREBASE_CONFIG');
  // Initialize Firebase
  app = initializeApp(cfg);
  try { analytics = getAnalytics(app); } catch (_) { /* analytics requires browser + allowed env */ }
  // Core SDKs
  auth = getAuth(app);
  firestore = getFirestore(app);
  rtdb = getDatabase(app);
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Firebase not initialized:', e && e.message ? e.message : String(e));
}

// --- Realtime Database helpers ---
async function writeData(path, value) { return set(ref(rtdb, path), value); }
async function pushData(path, value) { const r = push(ref(rtdb, path)); await set(r, value); return r.key; }
async function updateData(path, partial) { return update(ref(rtdb, path), partial); }
async function removeData(path) { return remove(ref(rtdb, path)); }
function onData(path, callback) { const r = ref(rtdb, path); const h = s => callback(s.val(), s); onValue(r, h); return () => off(r, 'value', h); }

// Exports and globals for quick usage
export { app, analytics, auth, firestore, rtdb, writeData, pushData, updateData, removeData, onData };
if (typeof window !== 'undefined') {
  Object.assign(window, { firebaseApp: app, firebaseAnalytics: analytics, firebaseAuth: auth, firestore, rtdb, writeData, pushData, updateData, removeData, onData });
}