import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyAb218BoJVu6kl40xYremGSlyWZCfGS3Tc",
  authDomain: "mini-bank-control.firebaseapp.com",
  projectId: "mini-bank-control",
  storageBucket: "mini-bank-control.firebasestorage.app",
  messagingSenderId: "646009086570",
  appId: "1:646009086570:web:f6a35406f86fae6fc4e013"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };


