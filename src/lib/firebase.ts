import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, browserLocalPersistence, setPersistence, onAuthStateChanged, type Auth, type User } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let firebaseApp: FirebaseApp;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const auth: Auth = getAuth(firebaseApp);
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Non-fatal; persistence might not be available in some environments
});

// Auth state stabilization helper
let authStateStabilized = false;
let authStatePromise: Promise<User | null> | null = null;

export const getStabilizedAuthState = (): Promise<User | null> => {
  if (authStatePromise) {
    return authStatePromise;
  }
  
  authStatePromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Wait for auth state to stabilize (no null user after 100ms)
      setTimeout(() => {
        unsubscribe();
        authStateStabilized = true;
        resolve(user);
      }, 100);
    });
  });
  
  return authStatePromise;
};

const db: Firestore = getFirestore(firebaseApp);
const storage: FirebaseStorage = getStorage(firebaseApp);

export { firebaseApp, auth, db, storage };

