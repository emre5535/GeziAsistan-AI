import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ─── Config from window (set in index.html) ──────────────────────────────────
const FIREBASE_CONFIG = window.__firebase_config || {};
const APP_ID = window.__app_id || 'default-app';

let app, auth, db;

export function initFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(FIREBASE_CONFIG);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  return { auth, db };
}

export function getFirebaseAuth() { return auth; }
export function getFirebaseDb() { return db; }
export function getAppId() { return APP_ID; }
export function getGoogleProvider() { return new GoogleAuthProvider(); }

// ─── Firestore path helper ────────────────────────────────────────────────────
export function routesPath(uid) {
  return `artifacts/${APP_ID}/users/${uid}/routes`;
}

// ─── Error code → Turkish ─────────────────────────────────────────────────────
const AUTH_ERRORS = {
  'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı.',
  'auth/popup-blocked': 'Tarayıcı açılır pencereyi engelledi. Lütfen izin verin.',
  'auth/cancelled-popup-request': 'Giriş işlemi iptal edildi.',
  'auth/network-request-failed': 'Ağ bağlantısı hatası.',
  'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekleyin.',
  'auth/user-disabled': 'Bu hesap devre dışı bırakıldı.',
  'auth/account-exists-with-different-credential': 'Bu e-posta farklı bir yöntemle kayıtlı.',
};

export function firebaseErrorToTr(code) {
  return AUTH_ERRORS[code] || 'Giriş yapılırken bir hata oluştu.';
}
