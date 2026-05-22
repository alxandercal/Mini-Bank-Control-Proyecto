  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"

const firebaseConfig = {
    apiKey: "AIzaSyAb218BoJVu6kl40xYremGSlyWZCfGS3Tc",
    authDomain: "mini-bank-control.firebaseapp.com",
    projectId: "mini-bank-control",
    storageBucket: "mini-bank-control.firebasestorage.app",
    messagingSenderId: "646009086570",
    appId: "1:646009086570:web:f6a35406f86fae6fc4e013"
  };

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
