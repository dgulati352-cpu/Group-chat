import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBcAKx1O3Iwk5kwm-52EhYz5tjVLmYUATY",
  authDomain: "chat-6a8cd.firebaseapp.com",
  projectId: "chat-6a8cd",
  storageBucket: "chat-6a8cd.firebasestorage.app",
  messagingSenderId: "680132984752",
  appId: "1:680132984752:web:ec54fb52190249733a6075",
  measurementId: "G-QXNDZQPNPB"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
