import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9Ql4W6XQ35d1clBvk5vtP0C9u7OYUjPw",
  authDomain: "civicconnect-9a895.firebaseapp.com",
  projectId: "civicconnect-9a895",
  storageBucket: "civicconnect-9a895.firebasestorage.app",
  messagingSenderId: "552777747832",
  appId: "1:552777747832:web:afdb5958aa1fdc6ed30c8d",
  measurementId: "G-SVFWZZSWZV"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Use device language for OTP SMS
auth.useDeviceLanguage();

export { app, auth, RecaptchaVerifier, signInWithPhoneNumber };
