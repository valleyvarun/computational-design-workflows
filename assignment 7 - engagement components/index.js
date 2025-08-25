// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, ref, set, push, onValue, off, update, remove } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBfUQ380DV8UyX3XAXcLD9YR3Xr1C7LgXI",
  authDomain: "q-n-a-e84a1.firebaseapp.com",
  databaseURL: "https://q-n-a-e84a1-default-rtdb.firebaseio.com",
  projectId: "q-n-a-e84a1",
  storageBucket: "q-n-a-e84a1.firebasestorage.app",
  messagingSenderId: "1039224628624",
  appId: "1:1039224628624:web:5963beec4197eb0ebdff15",
  measurementId: "G-JL0Y6PHFJE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
try { analytics = getAnalytics(app); } catch (_) { /* analytics requires browser + allowed env */ }

// Core SDKs
const auth = getAuth(app);
const firestore = getFirestore(app);
const rtdb = getDatabase(app);

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