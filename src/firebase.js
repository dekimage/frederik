import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBH8rQcLUSb57fOzY8tcJEKhIYf5v8QRxA",
  authDomain: "photography-shop.firebaseapp.com",
  projectId: "photography-shop",
  storageBucket: "photography-shop.appspot.com",
  messagingSenderId: "600363527445",
  appId: "1:600363527445:web:ad076e92aae42a469f8d1c",
  measurementId: "G-V1QD3SETN1",
};

// const analytics = getAnalytics(app);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, app, db };
