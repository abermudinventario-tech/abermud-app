// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAmZ6BDIrvipQH3alSF3fu-W3QHMIs8V3E",
  authDomain: "abermud-7bf0c.firebaseapp.com",
  projectId: "abermud-7bf0c",
  storageBucket: "abermud-7bf0c.firebasestorage.app",
  messagingSenderId: "592064738542",
  appId: "1:592064738542:web:b33c050136449d49466ff"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
