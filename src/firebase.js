import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAmZ6BDIrvipQH3alSF3fu-W3QHMIs8V3E",
  authDomain: "abermud-7bf0c.firebaseapp.com",
  projectId: "abermud-7bf0c",
  storageBucket: "abermud-7bf0c.firebasestorage.app",
  messagingSenderId: "592064738542",
  appId: "1:592064738542:web:b33c050136449d49466ff"
};
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAmZ6BDIrvipQH3alSF3fu-W3QHMIs8V3E",
  authDomain: "abermud-7bf0c.firebaseapp.com",
  projectId: "abermud-7bf0c",
  storageBucket: "abermud-7bf0c.firebasestorage.app",
  messagingSenderId: "592064738542",
  appId: "1:592064738542:web:b33c050136449d49466ff"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);
