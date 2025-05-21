import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_DUMMY_API_KEY",
  authDomain: "YOUR_DUMMY_AUTH_DOMAIN",
  projectId: "YOUR_DUMMY_PROJECT_ID",
  storageBucket: "YOUR_DUMMY_STORAGE_BUCKET",
  messagingSenderId: "YOUR_DUMMY_MESSAGING_SENDER_ID",
  appId: "YOUR_DUMMY_APP_ID"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);

export { app, auth };
