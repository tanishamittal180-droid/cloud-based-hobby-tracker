import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC5mm4AbP8hxTAWC994UGvCL-l42coVWDw",
  authDomain: "online-hobby-skills-trac-fcfaa.firebaseapp.com",
  projectId: "online-hobby-skills-trac-fcfaa",
  storageBucket: "online-hobby-skills-trac-fcfaa.firebasestorage.app",
  messagingSenderId: "770420129910",
  appId: "1:770420129910:web:7d5137c846feae3f491f57",
  measurementId: "G-BV6M0ZX792"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;